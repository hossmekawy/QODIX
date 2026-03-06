import os
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DocumentTemplate, GeneratedDocument
from .serializers import DocumentTemplateSerializer, GeneratedDocumentSerializer
from docxtpl import DocxTemplate
from docx2pdf import convert
import time

class DocumentTemplateViewSet(viewsets.ModelViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def generate_document(self, request, pk=None):
        template = self.get_object()
        client_id = request.data.get('client_id')
        project_id = request.data.get('project_id')
        custom_data = request.data.get('custom_data', {})

        if not client_id:
            return Response({"error": "client_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        doc = GeneratedDocument.objects.create(
            template=template,
            client_id=client_id,
            project_id=project_id if project_id else None,
            custom_data=custom_data,
            status='Draft'
        )

        # Word Document Generation
        if template.file:
            template_path = template.file.path
            if os.path.exists(template_path):
                docx = DocxTemplate(template_path)
                docx.render(custom_data)
                
                # Setup output paths
                timestamp = int(time.time())
                word_filename = f"gen_{doc.id}_{timestamp}.docx"
                pdf_filename = f"gen_{doc.id}_{timestamp}.pdf"
                
                word_rel_path = f"documents/word/{word_filename}"
                os.makedirs(os.path.join(settings.MEDIA_ROOT, 'documents/word'), exist_ok=True)
                word_abs_path = os.path.join(settings.MEDIA_ROOT, word_rel_path)
                
                docx.save(word_abs_path)
                doc.file_word.name = word_rel_path
                
                # PDF Generation
                pdf_rel_path = f"documents/pdf/{pdf_filename}"
                os.makedirs(os.path.join(settings.MEDIA_ROOT, 'documents/pdf'), exist_ok=True)
                pdf_abs_path = os.path.join(settings.MEDIA_ROOT, pdf_rel_path)
                
                try:
                    import pythoncom
                    pythoncom.CoInitialize()
                    convert(word_abs_path, pdf_abs_path)
                    doc.file_pdf.name = pdf_rel_path
                except Exception as e:
                    print(f"PDF Conversion failed: {e}")
                
                doc.save()
        
        serializer = GeneratedDocumentSerializer(doc)
        return Response(serializer.data)


class GeneratedDocumentViewSet(viewsets.ModelViewSet):
    queryset = GeneratedDocument.objects.all().order_by('-created_at')
    serializer_class = GeneratedDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        doc = self.get_object()
        doc.status = 'Sent'
        doc.save()
        return Response(GeneratedDocumentSerializer(doc).data)
