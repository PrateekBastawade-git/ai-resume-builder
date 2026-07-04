import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { CorporateTemplate } from '../templates/CorporateTemplate';
import { ModernTemplate } from '../templates/ModernTemplate';
import { Button } from '../../components/Button';
import { Download, ZoomIn, ZoomOut, RotateCcw, Layout } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export const PreviewPanel = () => {
  const { currentResume, updateCurrentResume } = useResume();
  const [zoom, setZoom] = useState(0.85); // Default zoom level

  if (!currentResume) return null;

  const handleDownloadPDF = () => {
    const element = document.getElementById('resume-pdf-content');
    if (!element) return;

    // Configuration tailored to prevent bad page breaks
    const options = {
      margin: 0,
      filename: `${currentResume.title || 'resume'}.pdf`,
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
      },
      pagebreak: { 
        mode: ['avoid-all', 'css'],
        before: '.page-break'
      }
    };

    // Execute html2pdf generation
    html2pdf().from(element).set(options).save();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.6));
  const handleZoomReset = () => setZoom(0.85);

  const handleTemplateChange = (e) => {
    updateCurrentResume({ template: e.target.value });
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full font-sans">
      
      {/* Floating Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm no-print">
        {/* Template Switcher */}
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-slate-400" />
          <select
            value={currentResume.template}
            onChange={handleTemplateChange}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="professional">Corporate Professional</option>
            <option value="modern">Modern Minimalist</option>
          </select>
        </div>

        {/* Zoom and Download actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <Button
            onClick={handleDownloadPDF}
            size="sm"
            className="flex items-center gap-1 text-xs shadow-md shadow-primary-500/10"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Scaling Document Preview Wrapper */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden flex justify-center p-2 rounded-2xl bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-800/20">
        <div 
          className="transition-transform duration-100 ease-out origin-top"
          style={{ 
            transform: `scale(${zoom})`,
            width: '210mm',
            minWidth: '210mm',
            marginBottom: `calc(297mm * (${zoom} - 1))` // Compensate height collapse from scaling
          }}
        >
          {/* Printable Element Wrapper */}
          <div id="resume-pdf-content" className="bg-white text-black shadow-lg rounded-sm overflow-hidden">
            {currentResume.template === 'professional' ? (
              <CorporateTemplate data={currentResume} />
            ) : (
              <ModernTemplate data={currentResume} />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
