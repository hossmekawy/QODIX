'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiCopy, FiCheck, FiFileText, FiAlertTriangle, FiZap, FiBook } from 'react-icons/fi';

interface CodeBlockProps {
    code: string;
    label?: string;
}

function CodeBlock({ code, label }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative mt-3 group">
            {label && <p className="text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">{label}</p>}
            <div className="bg-[#050205] border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/3">
                    <span className="text-xs text-[#721C97] font-mono">template.docx</span>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                        {copied ? <FiCheck className="w-3.5 h-3.5 text-[#C1FF72]" /> : <FiCopy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <pre className="p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{code}</pre>
            </div>
        </div>
    );
}

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: React.ReactNode;
    badge?: string;
}

function Accordion({ title, children, defaultOpen = false, icon, badge }: AccordionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={`border rounded-2xl overflow-hidden transition-all ${open ? 'border-[#721C97]/50 bg-[#721C97]/5' : 'border-white/10 bg-white/3'}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-[#C1FF72]">{icon}</span>}
                    <span className="font-semibold text-white text-lg">{title}</span>
                    {badge && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C1FF72]/10 text-[#C1FF72] border border-[#C1FF72]/20">{badge}</span>
                    )}
                </div>
                {open ? <FiChevronUp className="text-gray-400 w-5 h-5" /> : <FiChevronDown className="text-gray-400 w-5 h-5" />}
            </button>
            {open && (
                <div className="border-t border-white/10 px-6 py-5 space-y-4 text-gray-300">
                    {children}
                </div>
            )}
        </div>
    );
}

const steps = [
    {
        num: '01',
        title: 'Create your Word document (.docx)',
        desc: 'Open Microsoft Word (or Google Docs, LibreOffice) and design your document normally. Format it however you like — fonts, headers, tables, logos, colors.',
    },
    {
        num: '02',
        title: 'Insert variable placeholders',
        desc: 'Anywhere you want the system to auto-fill a value, type it in double curly braces. For example: {{ client_name }}. The variable name must match exactly what you declare in QODIX.',
    },
    {
        num: '03',
        title: 'Save as .docx',
        desc: 'Make sure to save the file as a Word Document (.docx) — not .doc or .pdf. This is the only format supported.',
    },
    {
        num: '04',
        title: 'Upload to QODIX Template Library',
        desc: 'Click "Upload Template", give it a name, select the type and language, list the variable names you used (comma-separated), and upload the file.',
    },
    {
        num: '05',
        title: 'Generate your first document',
        desc: 'Go to "Generate Document", pick your template, select a client & project, fill in the values for your variables, and download the final Word or PDF.',
    },
];

export default function TemplateGuidePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-white/10 pb-8">
                <Link
                    href="/dashboard/contracts/templates"
                    className="mt-1 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10 shrink-0"
                >
                    <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <FiBook className="w-7 h-7 text-[#C1FF72]" />
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Template Creation Guide
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Learn how to create professional Word document templates using dynamic variables
                        that QODIX auto-fills from your CRM and Project data.
                    </p>
                </div>
            </div>

            {/* How it works overview */}
            <div className="bg-gradient-to-br from-[#721C97]/15 to-[#C1FF72]/5 border border-[#721C97]/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <FiZap className="text-[#C1FF72]" /> How it works
                </h2>
                <p className="text-gray-300 leading-relaxed">
                    QODIX uses <strong className="text-white">Jinja2-style template tags</strong> inside standard Word documents.
                    Essentially, you write your contract or proposal once as a Word file, place
                    <code className="mx-1 px-2 py-0.5 rounded bg-black/50 text-[#C1FF72] font-mono text-sm">{'{{ variable_name }}'}</code>
                    wherever you want QODIX to inject data, then upload it.
                    Every time you generate a document, QODIX replaces those tags with the actual values you provide (or pulls them from the client&apos;s CRM profile).
                </p>
            </div>

            {/* Step by Step process */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-5">Step-by-step process</h2>
                <div className="space-y-4">
                    {steps.map((step, i) => (
                        <div key={i} className="flex gap-5 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-[#721C97]/20 border border-[#721C97]/50 flex items-center justify-center text-[#C1FF72] font-bold text-sm shrink-0 group-hover:bg-[#721C97]/40 transition-colors">
                                    {step.num}
                                </div>
                                {i < steps.length - 1 && <div className="w-px flex-1 mt-2 bg-gradient-to-b from-[#721C97]/30 to-transparent" />}
                            </div>
                            <div className="pb-6">
                                <h3 className="font-semibold text-white text-lg mb-1">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">In-depth topics</h2>

                <Accordion
                    title="Variable syntax & naming rules"
                    defaultOpen={true}
                    icon={<FiFileText className="w-5 h-5" />}
                    badge="Most Important"
                >
                    <p>
                        All variables must follow this format inside your Word document:
                    </p>
                    <CodeBlock
                        code={`{{ variable_name }}`}
                        label="Basic variable syntax"
                    />
                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <FiCheck className="text-[#C1FF72] shrink-0 mt-0.5" />
                            <p>Use <strong className="text-white">lowercase letters and underscores</strong> only. No spaces or dashes.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <FiCheck className="text-[#C1FF72] shrink-0 mt-0.5" />
                            <p>The name you use inside the Word file <strong className="text-white">must exactly match</strong> the variable name you enter in QODIX (case-sensitive).</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <FiCheck className="text-[#C1FF72] shrink-0 mt-0.5" />
                            <p>Put a <strong className="text-white">space between the the braces and the name</strong>: <code className="px-1.5 py-0.5 bg-black/50 text-[#C1FF72] rounded font-mono text-xs">{'{{ client_name }}'}</code> is correct, <code className="px-1.5 py-0.5 bg-black/50 text-red-400 rounded font-mono text-xs">{'{{client_name}}'}</code> also works but not recommended.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <FiAlertTriangle className="text-yellow-400 shrink-0 mt-0.5" />
                            <p><strong className="text-white">Never split a variable across lines</strong> in Word. Keep it on a single line or in a single text run.</p>
                        </div>
                    </div>
                </Accordion>

                <Accordion
                    title="Complete example: NDA Template"
                    icon={<FiFileText className="w-5 h-5" />}
                >
                    <p className="text-sm text-gray-400 mb-2">
                        Here is what a minimal NDA template looks like inside your Word document. The items in double curly braces are replaced automatically.
                    </p>
                    <CodeBlock
                        code={`NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of
{{ agreement_date }}, by and between:

QODIX (hereinafter "Company"), and

{{ client_name }}
{{ client_company }}, located at {{ client_address }}
(hereinafter "Client").

---

1. SCOPE OF WORK
The Company agrees to provide software development services for the
project titled "{{ project_name }}" as further described in the
Statement of Work.

2. CONFIDENTIALITY
Both parties agree not to disclose any confidential information
shared during the engagement period of {{ start_date }} to {{ end_date }}.

3. COMPENSATION
Total project value: {{ project_amount }} EGP
Payment schedule: {{ payment_terms }}

---

SIGNATURES

Company Representative: _______________________

Client Signature: _______________________
Name: {{ client_name }}
Date: {{ agreement_date }}`}
                    />
                    <div className="mt-4 p-4 bg-black/30 border border-white/5 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Variables used in this example</p>
                        <div className="flex flex-wrap gap-2">
                            {['agreement_date', 'client_name', 'client_company', 'client_address', 'project_name', 'start_date', 'end_date', 'project_amount', 'payment_terms'].map(v => (
                                <span key={v} className="text-xs font-mono px-2 py-1 rounded-lg bg-[#721C97]/20 border border-[#721C97]/30 text-[#C1FF72]">
                                    {`{{ ${v} }}`}
                                </span>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            When uploading this template to QODIX, enter these in the <strong className="text-gray-300">Variables</strong> field exactly as written above, separated by commas.
                        </p>
                    </div>
                </Accordion>

                <Accordion
                    title="Example: Website Proposal Template"
                    icon={<FiFileText className="w-5 h-5" />}
                >
                    <p className="text-sm text-gray-400 mb-2">
                        A sample proposal template for a website project.
                    </p>
                    <CodeBlock
                        code={`WEBSITE DEVELOPMENT PROPOSAL

Prepared For: {{ client_name }} | {{ client_company }}
Prepared By: QODIX
Date: {{ proposal_date }}

---

EXECUTIVE SUMMARY

We are pleased to submit this proposal for the development of
{{ website_type }} for {{ client_company }}.

PROJECT SCOPE
{{ scope_of_work }}

KEY DELIVERABLES
- Fully responsive website ({{ num_pages }} pages)
- Admin dashboard
- Deployment to {{ hosting_platform }}
- 30 days free support post-launch

TIMELINE
Estimated completion: {{ timeline }} weeks from project start.
Project kick-off: {{ start_date }}

INVESTMENT
Total Cost: {{ project_amount }} EGP
  - 50% upon signing: {{ upfront_amount }} EGP
  - 50% upon delivery: {{ final_amount }} EGP

---
Thank you for considering QODIX for your project, {{ client_name }}.`}
                    />
                </Accordion>

                <Accordion
                    title="Using variables inside tables"
                    icon={<FiFileText className="w-5 h-5" />}
                >
                    <p className="text-sm text-gray-400">
                        Variables work perfectly inside Word tables. Insert them as regular text in any table cell:
                    </p>
                    <CodeBlock
                        code={`┌─────────────────────────────┬─────────────────────────┐
│  Item                       │  Amount                 │
├─────────────────────────────┼─────────────────────────┤
│  {{ service_1 }}            │  {{ amount_1 }} EGP     │
│  {{ service_2 }}            │  {{ amount_2 }} EGP     │
├─────────────────────────────┼─────────────────────────┤
│  TOTAL                      │  {{ total_amount }} EGP │
└─────────────────────────────┴─────────────────────────┘`}
                        label="Table with variables"
                    />
                    <p className="text-sm text-yellow-400 mt-3 flex items-start gap-2">
                        <FiAlertTriangle className="shrink-0 mt-0.5" />
                        <span>Each variable must be in a single cell. Do not split a variable tag across multiple cells or rows.</span>
                    </p>
                </Accordion>

                <Accordion
                    title="Arabic (RTL) templates"
                    icon={<FiFileText className="w-5 h-5" />}
                >
                    <div className="space-y-3 text-sm">
                        <p>Arabic templates are fully supported. Follow the same rules, but write your document content in Arabic and set the text direction to RTL in Word.</p>
                        <div className="flex items-start gap-2">
                            <FiCheck className="text-[#C1FF72] shrink-0 mt-0.5" />
                            <p>Variable names should still use <strong className="text-white">English letters and underscores</strong> (e.g. <code className="px-1.5 py-0.5 bg-black/50 text-[#C1FF72] rounded font-mono text-xs">{'{{ client_name }}'}</code>), even in Arabic templates.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <FiCheck className="text-[#C1FF72] shrink-0 mt-0.5" />
                            <p>The surrounding text (contract body) can be fully in Arabic.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <FiCheck className="text-[#C1FF72] shrink-0 mt-0.5" />
                            <p>Select <strong className="text-white">Arabic</strong> as the language when uploading to QODIX — this helps with filtering and identification.</p>
                        </div>
                        <CodeBlock
                            code={`عقد تطوير موقع إلكتروني

الطرف الأول: شركة QODIX
الطرف الثاني: {{ client_name }} – {{ client_company }}
تاريخ العقد: {{ agreement_date }}

---

نطاق العمل:
{{ scope_of_work }}

القيمة الإجمالية للمشروع: {{ project_amount }} جنيه مصري
مدة التنفيذ: {{ timeline }} أسبوعاً`}
                            label="Arabic RTL example"
                        />
                    </div>
                </Accordion>

                <Accordion
                    title="Common mistakes to avoid"
                    icon={<FiAlertTriangle className="w-5 h-5" />}
                >
                    <div className="space-y-4 text-sm">
                        {[
                            {
                                bad: `{{client_name}}`,
                                good: `{{ client_name }}`,
                                note: 'Always include spaces inside the curly braces.',
                            },
                            {
                                bad: `{{ Client Name }}`,
                                good: `{{ client_name }}`,
                                note: 'Variable names cannot have spaces. Use underscores instead.',
                            },
                            {
                                bad: `{{ client-name }}`,
                                good: `{{ client_name }}`,
                                note: 'No dashes. Use underscore only.',
                            },
                            {
                                bad: `{{ clientName }}`,
                                good: `{{ client_name }}`,
                                note: 'Avoid camelCase — use snake_case for consistency.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="grid grid-cols-2 gap-3">
                                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                                    <p className="text-xs text-red-400 font-semibold mb-1.5">❌ Wrong</p>
                                    <code className="text-red-300 font-mono text-sm">{item.bad}</code>
                                </div>
                                <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                                    <p className="text-xs text-green-400 font-semibold mb-1.5">✅ Correct</p>
                                    <code className="text-green-300 font-mono text-sm">{item.good}</code>
                                </div>
                                <p className="col-span-2 text-gray-400 text-xs pl-1">→ {item.note}</p>
                            </div>
                        ))}
                    </div>
                </Accordion>

                <Accordion
                    title="Tips for a professional looking template"
                    icon={<FiZap className="w-5 h-5" />}
                >
                    <ul className="space-y-3 text-sm">
                        {[
                            'Add your company logo at the top of the document (Word → Insert → Pictures).',
                            'Use Word Styles (Heading 1, Heading 2, Normal) for consistent formatting.',
                            'Use page numbers via Insert → Page Number.',
                            'Add a footer with your company name and website.',
                            'For contracts, include a signature line using a table with two columns: Company Signature and Client Signature.',
                            'Set page margins to 2.5cm on all sides for a professional print layout.',
                            'Consider using Word\'s "Text Box" for highlighted sections like "Total Amount" or "Key Deliverables".',
                        ].map((tip, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-[#721C97]/20 border border-[#721C97]/30 text-[#C1FF72] text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                    {i + 1}
                                </span>
                                <span className="text-gray-300">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </Accordion>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-[#721C97]/20 to-[#C1FF72]/5 border border-[#721C97]/40 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Ready to upload your template?</h3>
                    <p className="text-gray-400">Go back to the Template Library and click "Upload Template".</p>
                </div>
                <Link
                    href="/dashboard/contracts/templates"
                    className="flex items-center gap-2 bg-[#C1FF72] text-[#070308] px-7 py-3 rounded-xl hover:bg-[#aee661] transition-all font-bold shadow-[0_0_20px_rgba(193,255,114,0.25)] whitespace-nowrap"
                >
                    <FiFileText className="w-5 h-5" />
                    Back to Template Library
                </Link>
            </div>
        </div>
    );
}
