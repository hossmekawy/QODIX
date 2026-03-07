'use client';
import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for reliable audio recording using Web Audio API + ScriptProcessor.
 * Captures raw PCM samples and encodes to WAV format.
 * This bypasses all MediaRecorder codec issues that can cause silent recordings.
 */
export function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const chunksRef = useRef<Float32Array[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback(async () => {
        try {
            // navigator.mediaDevices requires a secure context (HTTPS or localhost)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Voice recording requires HTTPS. Microphone access is blocked on HTTP connections by the browser.');
                return;
            }

            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1,
                }
            });
            streamRef.current = stream;

            // Create AudioContext
            const audioContext = new AudioContext({ sampleRate: 44100 });
            audioContextRef.current = audioContext;

            // Create source from stream
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Create ScriptProcessor to capture raw PCM data
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            chunksRef.current = [];

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                chunksRef.current.push(new Float32Array(inputData));
            };

            // Connect: source -> processor -> destination
            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);
            setRecordingTime(0);
            setAudioBlob(null);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                alert('Microphone permission was denied. Please allow microphone access in your browser settings.');
            } else {
                console.error('Microphone access error:', err);
                alert('Could not access microphone. Please check your browser settings.');
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        // Disconnect and clean up audio nodes
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Encode captured PCM data to WAV
        const chunks = chunksRef.current;
        if (chunks.length > 0) {
            const sampleRate = 44100;
            const wavBlob = encodeWAV(chunks, sampleRate);
            setAudioBlob(wavBlob);
        }

        setIsRecording(false);
    }, []);

    const cancelRecording = useCallback(() => {
        // Clean up without saving
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        chunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
        setAudioBlob(null);
    }, []);

    const clearAudioBlob = useCallback(() => {
        setAudioBlob(null);
        setRecordingTime(0);
    }, []);

    return {
        isRecording,
        recordingTime,
        audioBlob,
        startRecording,
        stopRecording,
        cancelRecording,
        clearAudioBlob,
    };
}

/**
 * Encode Float32Array PCM chunks into a WAV file Blob.
 * WAV is universally supported for playback on all browsers and OSes.
 */
function encodeWAV(chunks: Float32Array[], sampleRate: number): Blob {
    // Merge all chunks into one buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }

    // Convert Float32 [-1, 1] to Int16 PCM
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataLength = merged.length * bytesPerSample;

    // Create WAV header (44 bytes) + data
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM samples
    let sampleOffset = 44;
    for (let i = 0; i < merged.length; i++) {
        // Clamp to [-1, 1] and convert to int16
        const s = Math.max(-1, Math.min(1, merged[i]));
        const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(sampleOffset, val, true);
        sampleOffset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
