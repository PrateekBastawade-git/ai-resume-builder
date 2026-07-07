import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { coverLetterAgent } from '../../ai/agent/coverLetterAgent';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  CheckCircle2,
  Building2,
  Briefcase,
  Download,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

export const CoverLetterPage = () => {
  const { resumes, currentResume, setCurrentResume } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedResume = currentResume;

  const handleGenerate = async () => {
    if (!selectedResume || !jobDescription.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await coverLetterAgent.generate(selectedResume, jobDescription, companyName, targetRole);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Cover letter generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const fullText = `${result.subject}\n\n${result.salutation}\n\n${result.body}\n\n${result.signOff}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadPDF = () => {
    if (!result || !selectedResume) return;

    // Create a temporary element to render the print version of the cover letter
    const element = document.createElement('div');
    element.className = 'p-12 bg-white text-slate-900 font-serif space-y-6';
    element.style.width = '210mm'; // A4 Width
    element.style.boxSizing = 'border-box';

    element.innerHTML = `
      <!-- Letterhead / Header -->
      <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="font-size: 24pt; font-weight: bold; color: #1e293b; margin: 0;">${selectedResume.personalInfo?.name || 'Candidate Name'}</h1>
        <p style="font-size: 11pt; font-weight: 600; color: #4f46e5; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${selectedResume.personalInfo?.title || 'Professional Title'}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 9pt; color: #64748b; margin-top: 12px; font-family: sans-serif;">
          ${selectedResume.personalInfo?.email ? `<span>✉ ${selectedResume.personalInfo.email}</span>` : ''}
          ${selectedResume.personalInfo?.phone ? `<span>☎ ${selectedResume.personalInfo.phone}</span>` : ''}
          ${selectedResume.personalInfo?.website ? `<span>🌐 ${selectedResume.personalInfo.website}</span>` : ''}
          ${selectedResume.personalInfo?.linkedin ? `<span>in ${selectedResume.personalInfo.linkedin}</span>` : ''}
        </div>
      </div>

      <!-- Letter Content -->
      <div style="font-size: 11pt; line-height: 1.6; color: #334155; font-family: 'Times New Roman', Times, serif;">
        <!-- Date -->
        <p style="margin-bottom: 24px; font-family: sans-serif; font-size: 9pt; color: #94a3b8;">${result.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <!-- Recipient -->
        <div style="margin-bottom: 24px; font-family: sans-serif; font-size: 9pt; color: #64748b; line-height: 1.4;">
          <p style="font-weight: bold; color: #475569; margin: 0;">To,</p>
          <p style="font-weight: bold; color: #1e293b; margin: 2px 0;">${companyName || 'Hiring Team'}</p>
          ${companyName ? `<p style="margin: 0;">${companyName} Recruiting</p>` : ''}
        </div>

        <!-- Subject -->
        <p style="font-weight: bold; color: #0f172a; margin-top: 24px; margin-bottom: 16px; border-left: 3px solid #cbd5e1; padding-left: 12px; font-style: italic;">
          ${result.subject}
        </p>

        <!-- Salutation -->
        <p style="font-weight: 600; color: #1e293b; margin-top: 16px; margin-bottom: 12px;">${result.salutation}</p>

        <!-- Body -->
        <div style="margin-bottom: 24px;">
          ${result.body.split('\n\n').map(p => `<p style="margin-bottom: 14px; text-indent: 24px; text-align: justify;">${p}</p>`).join('')}
        </div>

        <!-- Closing -->
        <div style="margin-top: 36px; padding-top: 16px;">
          <p style="margin-bottom: 48px; font-weight: 600; color: #1e293b;">Sincerely,</p>
          <div>
            <p style="font-weight: bold; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; width: 200px; margin: 0;">${selectedResume.personalInfo?.name || 'Candidate Name'}</p>
            <p style="font-size: 9pt; color: #64748b; font-family: sans-serif; margin: 2px 0 0 0;">${selectedResume.personalInfo?.title || ''}</p>
          </div>
        </div>
      </div>
    `;

    // Options for high quality render
    const options = {
      margin: 15,
      filename: `Cover_Letter_${selectedResume.personalInfo?.name?.replace(/\s+/g, '_') || 'Candidate'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    try {
      const html2pdfLib = typeof html2pdf === 'function' ? html2pdf : (html2pdf.default || html2pdf);
      html2pdfLib().from(element).set(options).save();
    } catch (err) {
      console.warn('Cover letter PDF export error, falling back to print:', err);
      let printRoot = document.getElementById('print-root');
      if (!printRoot) {
        printRoot = document.createElement('div');
        printRoot.id = 'print-root';
        document.body.appendChild(printRoot);
      }
      printRoot.innerHTML = '';
      printRoot.appendChild(element);
      setTimeout(() => window.print(), 150);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-md">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Cover Letter Writer</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Generate a compelling, personalized cover letter tailored to the job</p>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume selector + metadata */}
        <div className="space-y-4">
          {/* Resume Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase">
              Select Resume
            </label>
            {resumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-white dark:bg-slate-900">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">No resumes yet. Go to Dashboard to create one.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => setCurrentResume(resume)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                      selectedResume?.id === resume.id
                        ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-950/20 ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <FileText className={`w-4 h-4 flex-shrink-0 ${selectedResume?.id === resume.id ? 'text-primary-600' : 'text-slate-400'}`} />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex-1">{resume.title}</p>
                    {selectedResume?.id === resume.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Stripe, OpenAI"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
            />
          </div>

          {/* Target Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Right: Job Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={11}
            placeholder="Paste the job description here. The more detail you provide, the more tailored your cover letter will be…"
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!selectedResume || !jobDescription.trim()}
          loading={loading}
          className="flex items-center gap-2 px-6"
        >
          <Sparkles className="w-4 h-4" />
          Generate Cover Letter
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Result: Cover Letter Preview */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cover Letter Preview</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy All</>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </Button>
              </div>
            </div>

            {/* Letter Content */}
            <div className="px-8 py-6 space-y-5 font-serif">
              {/* Subject */}
              <p className="text-sm font-bold text-slate-900 dark:text-white">{result.subject}</p>

              {/* Salutation */}
              <p className="text-sm text-slate-700 dark:text-slate-300">{result.salutation}</p>

              {/* Body */}
              <div className="space-y-3">
                {result.body.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Sign Off */}
              <div className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{result.signOff}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
