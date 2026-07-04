import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from '../preview/PreviewPanel';
import { AIPanel } from './AIPanel';
import { ChevronLeft, FileText, Eye, ShieldCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTION_METADATA = {
  edit: { label: 'Edit Form', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30' },
  preview: { label: 'Resume Preview', icon: Eye, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30' },
  ats: { label: 'ATS Optimizer', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30' },
  chat: { label: 'AI Chat', icon: MessageSquare, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30' }
};

export const Editor = () => {
  const { id, section } = useParams();
  const navigate = useNavigate();
  const { resumes, currentResume, setCurrentResume, updateCurrentResume, loading } = useResume();

  const activeTab = section || 'edit';

  // Set the current resume based on the ID parameter and handle redirect
  useEffect(() => {
    if (!loading && resumes.length > 0) {
      const match = resumes.find(r => r.id === id);
      if (match) {
        setCurrentResume(match);
        if (!section) {
          navigate(`/editor/${id}/edit`, { replace: true });
        }
      } else {
        navigate('/');
      }
    }
  }, [id, section, resumes, loading, setCurrentResume, navigate]);

  if (loading || !currentResume) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading editor…</span>
        </div>
      </div>
    );
  }

  const meta = SECTION_METADATA[activeTab] || SECTION_METADATA.edit;
  const ActiveIcon = meta.icon;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">

      {/* ── Editor Sub-Header ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-3 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0 border border-slate-150 dark:border-slate-800"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
            <input
              type="text"
              value={currentResume.title}
              onChange={(e) => updateCurrentResume({ title: e.target.value })}
              className="text-sm font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-350 dark:hover:border-slate-700 focus:border-primary-500 focus:outline-none py-0.5 transition w-40 sm:w-56 truncate"
              placeholder="Resume Title"
            />
            
            {/* Section Badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color} self-start sm:self-center`}>
              <ActiveIcon className="w-3.5 h-3.5" />
              <span>{meta.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full overflow-y-auto"
          >
            {/* ── EDIT FORM ────────────────────────────────────────── */}
            {activeTab === 'edit' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
                <EditorPanel />
              </div>
            )}

            {/* ── RESUME PREVIEW ───────────────────────────────────── */}
            {activeTab === 'preview' && (
              <div className="h-full p-4 sm:p-8 flex justify-center items-start bg-slate-100/40 dark:bg-slate-950 overflow-y-auto">
                <div className="w-full max-w-5xl pb-8">
                  <PreviewPanel />
                </div>
              </div>
            )}

            {/* ── ATS OPTIMIZER ────────────────────────────────────── */}
            {activeTab === 'ats' && (
              <div className="h-full p-4 sm:p-6 overflow-y-auto">
                <AIPanelPage defaultTab="ats" />
              </div>
            )}

            {/* ── AI CHAT ASSISTANT ─────────────────────────────────── */}
            {activeTab === 'chat' && (
              <div className="h-full p-4 sm:p-6 overflow-y-auto">
                <AIPanelPage defaultTab="chat" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

const AIPanelPage = ({ defaultTab }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <AIPanel forcedTab={defaultTab} fullPage />
    </div>
  );
};
