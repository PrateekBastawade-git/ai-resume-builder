import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { atsAgent } from '../../ai/agent/atsAgent';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  TrendingUp,
  Tag,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react';

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score = 0, label, color }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const colorMap = {
    green: { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' },
    red:   { stroke: '#ef4444', text: 'text-red-500' },
    blue:  { stroke: '#6366f1', text: 'text-indigo-600 dark:text-indigo-400' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-slate-800" />
          <motion.circle
            cx="44" cy="44" r={radius}
            fill="none" stroke={c.stroke} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-black ${c.text}`}>{score}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">{label}</span>
    </div>
  );
};

// ─── Score color helper ───────────────────────────────────────────────────────
const getColor = (score) => {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
};

// ─── AtsPage ─────────────────────────────────────────────────────────────────
export const AtsPage = () => {
  const { resumes, currentResume, setCurrentResume } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const selectedResume = currentResume;

  const handleAnalyze = async () => {
    if (!selectedResume || !jobDescription.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await atsAgent.analyze(selectedResume, jobDescription);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => setExpandedSection(expandedSection === key ? null : key);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">ATS Resume Auditor</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analyze how your resume performs against a specific job description</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{resume.title}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">{resume.template} template</p>
                  </div>
                  {selectedResume?.id === resume.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={9}
            placeholder="Paste the full job description here. Include responsibilities, required skills, and qualifications for the most accurate ATS analysis…"
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={!selectedResume || !jobDescription.trim()}
          loading={loading}
          className="flex items-center gap-2 px-6"
        >
          <Sparkles className="w-4 h-4" />
          Analyze ATS Match
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Score Rings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-600" />
                Match Scores
              </h2>
              <div className="flex flex-wrap gap-8 justify-around">
                {result.scores && Object.entries(result.scores).map(([key, val]) => (
                  <ScoreRing
                    key={key}
                    score={typeof val === 'number' ? val : Number(val)}
                    label={key.replace(/([A-Z])/g, ' $1').trim()}
                    color={getColor(typeof val === 'number' ? val : Number(val))}
                  />
                ))}
              </div>
            </div>

            {/* Strengths / Weaknesses / Keywords / Suggestions */}
            {[
              { key: 'strengths', label: 'Strengths', icon: CheckCircle2, color: 'emerald' },
              { key: 'weaknesses', label: 'Weaknesses', icon: XCircle, color: 'red' },
              { key: 'missingKeywords', label: 'Missing Keywords', icon: Tag, color: 'amber' },
              { key: 'suggestions', label: 'Optimization Suggestions', icon: TrendingUp, color: 'indigo' },
            ].map(({ key, label, icon: Icon, color }) => (
              result[key]?.length > 0 && (
                <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 text-${color}-500`} />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${color}-50 dark:bg-${color}-950/30 text-${color}-600 dark:text-${color}-400`}>
                        {result[key].length}
                      </span>
                    </span>
                    {expandedSection === key ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {expandedSection === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <ul className="px-5 pb-4 space-y-2">
                          {result[key].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <span className={`mt-1 w-1.5 h-1.5 rounded-full bg-${color}-400 flex-shrink-0`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
