'use client';
import { useState } from 'react';
import { FiDownload, FiFileText, FiPrinter, FiCheckSquare, FiCalendar, FiFilter, FiActivity, FiUsers, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

interface ProjectReportTabProps {
    project: any;
}

export default function ProjectReportTab({ project }: ProjectReportTabProps) {
    const [config, setConfig] = useState({
        includeDetails: true,
        includeTasks: true,
        includeTeam: true,
        includeFinancials: true,
        includeDocs: true,
        includeBugs: true,
        dateFrom: '',
        dateTo: ''
    });

    const [isGenerating, setIsGenerating] = useState(false);

    // Helper: Filter by date range
    const isWithinDateRange = (dateString: string) => {
        if (!dateString) return true;
        const d = new Date(dateString);
        if (config.dateFrom && d < new Date(config.dateFrom)) return false;
        if (config.dateTo && d > new Date(config.dateTo)) return false;
        return true;
    };

    // Filtered Data
    const tasks = project?.tasks?.filter((t: any) => isWithinDateRange(t.created_at || t.due_date)) || [];
    const payments = project?.payments?.filter((p: any) => isWithinDateRange(p.due_date || p.received_date)) || [];
    const bugs = project?.bugs?.filter((b: any) => isWithinDateRange(b.created_at)) || [];
    const deliverables = project?.deliverables?.filter((d: any) => isWithinDateRange(d.expected_date)) || [];

    const handlePrintPDF = () => {
        const printContent = document.getElementById('report-print-zone');
        if (printContent) {
            const printWindow = window.open('', '', 'width=900,height=800');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Report: ${project?.name || 'Project'}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>
                                @media print {
                                    @page { margin: 15mm; size: auto; }
                                    ::-webkit-scrollbar { display: none; }
                                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                }
                            </style>
                        </head>
                        <body class="bg-white p-6">
                            ${printContent.innerHTML}
                            <script>
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 800);
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }
    };

    const handleExportCSV = () => {
        setIsGenerating(true);
        try {
            let csvContent = "data:text/csv;charset=utf-8,";

            // 1. Project Header
            csvContent += "REPORT: PROJECT SUMMARY\n";
            csvContent += `Project Name:,${project?.name || ''}\n`;
            csvContent += `Client:,${project?.customer_details?.name || ''}\n`;
            csvContent += `Status:,${project?.status || ''}\n`;
            csvContent += `Start Date:,${project?.start_date || ''}\n`;
            csvContent += `Deadline:,${project?.deadline || ''}\n\n`;

            if (config.includeTasks && tasks.length > 0) {
                csvContent += "TASKS\n";
                csvContent += "Title,Status,Priority,Due Date,Est Hours,Actual Hours\n";
                tasks.forEach((t: any) => {
                    csvContent += `"${t.title}","${t.status}","${t.priority}","${t.due_date || ''}","${t.estimated_hours || 0}","${t.actual_hours || 0}"\n`;
                });
                csvContent += "\n";
            }

            if (config.includeTeam && project?.team_members?.length > 0) {
                csvContent += "TEAM DIRECTORY\n";
                csvContent += "Name,Role,Allocated Hours\n";
                project.team_members.forEach((tm: any) => {
                    csvContent += `"${tm.user_details?.first_name} ${tm.user_details?.last_name}","${tm.role}","${tm.allocated_hours}"\n`;
                });
                csvContent += "\n";
            }

            if (config.includeFinancials && payments.length > 0) {
                csvContent += "FINANCIAL PAYMENTS\n";
                csvContent += "Invoice #,Due Date,Status,Amount\n";
                payments.forEach((p: any) => {
                    csvContent += `"${p.id}","${p.due_date || ''}","${p.status}","${p.amount}"\n`;
                });
                csvContent += "\n";
            }

            if (config.includeBugs && bugs.length > 0) {
                csvContent += "QUALITY ASSURANCE / BUGS\n";
                csvContent += "Bug Title,Status,Priority,Created\n";
                bugs.forEach((b: any) => {
                    csvContent += `"${b.name}","${b.status}","${b.priority}","${new Date(b.created_at).toLocaleDateString()}"\n`;
                });
                csvContent += "\n";
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Project_Report_${project?.name?.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e) {
            console.error("Export failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportExcel = () => {
        // Simple HTML-Table to XLS approach natively supported by MS Excel
        let tableHTML = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8"></head><body>
            <h2>Project Report: ${project?.name || ''}</h2>
            <table>
                <tr><td><b>Client:</b></td><td>${project?.customer_details?.name || ''}</td></tr>
                <tr><td><b>Status:</b></td><td>${project?.status || ''}</td></tr>
                <tr><td><b>Start Date:</b></td><td>${project?.start_date || ''}</td></tr>
                <tr><td><b>Deadline:</b></td><td>${project?.deadline || ''}</td></tr>
            </table><br/>
        `;

        if (config.includeTasks && tasks.length > 0) {
            tableHTML += `<h3>Tasks</h3><table border="1">
                <tr><th>Title</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Est Hours</th><th>Actual Hours</th></tr>`;
            tasks.forEach((t: any) => {
                tableHTML += `<tr><td>${t.title}</td><td>${t.status}</td><td>${t.priority}</td><td>${t.due_date || ''}</td><td>${t.estimated_hours || 0}</td><td>${t.actual_hours || 0}</td></tr>`;
            });
            tableHTML += `</table><br/>`;
        }

        if (config.includeFinancials && payments.length > 0) {
            tableHTML += `<h3>Financials</h3><table border="1">
                <tr><th>Invoice ID</th><th>Due Date</th><th>Status</th><th>Amount</th><th>Received Date</th></tr>`;
            payments.forEach((p: any) => {
                tableHTML += `<tr><td>${p.id}</td><td>${p.due_date || ''}</td><td>${p.status}</td><td>${p.amount}</td><td>${p.received_date || ''}</td></tr>`;
            });
            tableHTML += `</table><br/>`;
        }

        tableHTML += `</body></html>`;
        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Project_Report_${project?.name?.replace(/\s+/g, '_')}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">

            {/* Configuration Dashboard (Hidden when Printing) */}
            <div className="bg-[#070308] border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg print-hidden animate-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg md:text-xl font-black text-white mb-6 flex items-center gap-2">
                    <FiFilter className="text-[#721C97]" /> Report Data Filters Options
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Include Checkboxes */}
                    <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4 border-b border-white/10 pb-2">Modules to Include</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={config.includeDetails} onChange={e => setConfig({ ...config, includeDetails: e.target.checked })} className="w-4 h-4 rounded bg-[#070308] border-white/20 text-[#721C97] accent-[#721C97] group-hover:border-[#721C97] transition-colors" />
                                <span className="text-gray-300 text-sm font-bold flex items-center gap-2"><FiActivity /> Primary Details</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={config.includeTasks} onChange={e => setConfig({ ...config, includeTasks: e.target.checked })} className="w-4 h-4 rounded bg-[#070308] border-white/20 text-blue-500 accent-blue-500 group-hover:border-blue-500 transition-colors" />
                                <span className="text-gray-300 text-sm font-bold flex items-center gap-2"><FiCheckSquare /> Action Tasks</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={config.includeTeam} onChange={e => setConfig({ ...config, includeTeam: e.target.checked })} className="w-4 h-4 rounded bg-[#070308] border-white/20 text-purple-500 accent-purple-500 group-hover:border-purple-500 transition-colors" />
                                <span className="text-gray-300 text-sm font-bold flex items-center gap-2"><FiUsers /> Team Roster</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={config.includeFinancials} onChange={e => setConfig({ ...config, includeFinancials: e.target.checked })} className="w-4 h-4 rounded bg-[#070308] border-white/20 text-emerald-500 accent-emerald-500 group-hover:border-emerald-500 transition-colors" />
                                <span className="text-gray-300 text-sm font-bold flex items-center gap-2"><FiDollarSign /> Financial Flow</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={config.includeBugs} onChange={e => setConfig({ ...config, includeBugs: e.target.checked })} className="w-4 h-4 rounded bg-[#070308] border-white/20 text-amber-500 accent-amber-500 group-hover:border-amber-500 transition-colors" />
                                <span className="text-gray-300 text-sm font-bold flex items-center gap-2"><FiAlertCircle /> QA / Bugs</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={config.includeDocs} onChange={e => setConfig({ ...config, includeDocs: e.target.checked })} className="w-4 h-4 rounded bg-[#070308] border-white/20 text-pink-500 accent-pink-500 group-hover:border-pink-500 transition-colors" />
                                <span className="text-gray-300 text-sm font-bold flex items-center gap-2"><FiFileText /> Deliverables</span>
                            </label>
                        </div>
                    </div>

                    {/* Date Filters */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4 border-b border-white/10 pb-2">Custom Date Range</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">From Date</label>
                                <div className="relative">
                                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="date" value={config.dateFrom} onChange={e => setConfig({ ...config, dateFrom: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-[#721C97] transition-colors text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">To Date (Inclusive)</label>
                                <div className="relative">
                                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="date" value={config.dateTo} onChange={e => setConfig({ ...config, dateTo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-[#721C97] transition-colors text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Engine */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
                    <p className="text-sm text-gray-400 italic">Configure constraints before generating your preferred format.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleExportCSV} className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-[#070308] border border-white/20 text-white hover:bg-white/5 transition-colors">
                            <FiDownload /> Export CSV
                        </button>
                        <button onClick={handleExportExcel} className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-[#070308] border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            <FiFileText /> Export XLSX
                        </button>
                        <button onClick={handlePrintPDF} className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-2.5 rounded-xl font-black bg-[#721C97] text-white hover:bg-[#8d24ba] transition-all shadow-[0_0_20px_rgba(114,28,151,0.4)]">
                            <FiPrinter /> Print to PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* PRINT OPTIMIZED PREVIEW */}
            <div className="bg-white rounded-2xl p-8 min-h-[800px] print-only-target shadow-[0_0_50px_rgba(255,255,255,0.05)] mx-auto border border-white/5 mt-8" id="report-print-zone">
                {/* PDF Header */}
                <div className="border-b-2 border-gray-200 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{project?.name}</h1>
                        <p className="text-lg text-gray-500 mt-1 font-bold">Comprehensive Master Report</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600"><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                        {(config.dateFrom || config.dateTo) && (
                            <p className="text-sm text-gray-600 mt-1">
                                <strong>Period:</strong> {config.dateFrom || '*'} to {config.dateTo || '*'}
                            </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1"><strong>Client:</strong> {project?.customer_details?.name}</p>
                    </div>
                </div>

                <div className="space-y-12 text-gray-800">

                    {config.includeDetails && (
                        <section>
                            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2 mb-4 text-[#721C97]">Project Details</h2>
                            <div className="grid grid-cols-2 gap-y-4 text-sm bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <div><span className="font-bold text-gray-500 block uppercase text-xs mb-1">Status</span><span className="text-lg font-bold">{project?.status}</span></div>
                                <div><span className="font-bold text-gray-500 block uppercase text-xs mb-1">Manager Overview</span>{project?.description || 'N/A'}</div>
                                <div><span className="font-bold text-gray-500 block uppercase text-xs mb-1">Start Date</span>{project?.start_date || 'TBD'}</div>
                                <div><span className="font-bold text-gray-500 block uppercase text-xs mb-1">Deadline Date</span>{project?.deadline || 'TBD'}</div>
                                <div className="col-span-2 mt-2 pt-4 border-t border-gray-200">
                                    <span className="font-bold text-gray-500 block uppercase text-xs mb-2">Scope Definition</span>
                                    <p className="whitespace-pre-wrap font-mono text-xs text-gray-700 bg-white p-4 rounded-lg border border-gray-200">{project?.scope || 'No scope defined.'}</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {config.includeTasks && tasks.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2 mb-4 text-blue-600">Action Tasks</h2>
                            <table className="w-full text-left text-sm border-collapse rounded-xl overflow-hidden border border-gray-200">
                                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-3 border-b border-gray-200">Title</th>
                                        <th className="p-3 border-b border-gray-200">Status</th>
                                        <th className="p-3 border-b border-gray-200">Priority</th>
                                        <th className="p-3 border-b border-gray-200">Due Date</th>
                                        <th className="p-3 border-b border-gray-200">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {tasks.map((task: any) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-semibold text-gray-900">{task.title}</td>
                                            <td className="p-3">{task.status}</td>
                                            <td className="p-3">{task.priority}</td>
                                            <td className="p-3 text-gray-500">{task.due_date || '-'}</td>
                                            <td className="p-3">
                                                <span className="font-mono text-xs">{task.actual_hours || 0} / {task.estimated_hours || 0} Hrs</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {config.includeFinancials && payments.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2 mb-4 text-emerald-600">Financial Ledger</h2>
                            <table className="w-full text-left text-sm border-collapse rounded-xl overflow-hidden border border-gray-200">
                                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-3 border-b border-gray-200">Invoice ID</th>
                                        <th className="p-3 border-b border-gray-200">Status</th>
                                        <th className="p-3 border-b border-gray-200">Due Date</th>
                                        <th className="p-3 border-b border-gray-200 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {payments.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-mono text-xs text-gray-500">#{p.id.substring(0, 8)}</td>
                                            <td className="p-3 font-bold">{p.status}</td>
                                            <td className="p-3 text-gray-500">{p.due_date || '-'}</td>
                                            <td className="p-3 text-right font-black text-emerald-600">${parseFloat(p.amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {config.includeTeam && project?.team_members?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2 mb-4 text-purple-600">Team Allocation</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {project.team_members.map((tm: any) => (
                                    <div key={tm.id} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900">{tm.user_details?.first_name} {tm.user_details?.last_name}</p>
                                            <p className="text-xs text-purple-600 font-bold">{tm.role}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Hours</p>
                                            <p className="font-black text-gray-700">{tm.allocated_hours}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {config.includeBugs && bugs.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2 mb-4 text-amber-600">QA Tracking</h2>
                            <table className="w-full text-left text-sm border-collapse rounded-xl overflow-hidden border border-gray-200">
                                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-3 border-b border-gray-200">ID</th>
                                        <th className="p-3 border-b border-gray-200 w-1/2">Bug Context</th>
                                        <th className="p-3 border-b border-gray-200">Status</th>
                                        <th className="p-3 border-b border-gray-200">Priority</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {bugs.map((b: any) => (
                                        <tr key={b.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-mono text-xs text-gray-500">#{b.id.substring(0, 6)}</td>
                                            <td className="p-3 text-gray-900">{b.name}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'Resolved' || b.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>{b.status}</span>
                                            </td>
                                            <td className="p-3 font-bold">{b.priority}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {config.includeDocs && deliverables.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2 mb-4 text-pink-600">Milestones & Code</h2>
                            <ul className="space-y-3">
                                {deliverables.map((d: any) => (
                                    <li key={d.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{d.title}</span>
                                            <span className="text-xs text-gray-500 line-clamp-1">{d.link || 'No URL attached'}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${d.status === 'Completed' ? 'text-emerald-600' : 'text-gray-500'}`}>{d.status}</p>
                                            <p className="text-xs text-gray-400">{d.expected_date || 'TBD'}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                </div>

                {/* Footer branding */}
                <div className="mt-16 pt-6 border-t border-gray-200 text-center flex flex-col items-center">
                    <p className="font-black text-xl italic bg-gradient-to-r from-gray-900 to-gray-500 text-transparent bg-clip-text">QODIX.AI SYSTEM</p>
                    <p className="text-xs text-gray-400 mt-1">CONFIDENTIAL ASSET DOCUMENT</p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 15mm; size: auto; }
                    body { background: white !important; }
                    .print-hidden { display: none !important; }
                    .print-only-target { display: block !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; min-height: auto !important; }
                    .print-break-avoid { page-break-inside: avoid; }
                    ::-webkit-scrollbar { display: none; }
                }
            `}} />
        </div>
    );
}
