import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { interviewAgent } from '../../ai/agent/interviewAgent';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  MessageSquare,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  Easy:   'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
  Medium: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  Hard:   'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/40',
};

const TYPE_COLORS = {
  Technical:  'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400',
  Behavioral: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400',
  Situational:'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
};

const QuestionCard = ({ q, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
      >
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs flex-shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {q.type && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[q.type] || TYPE_COLORS.Technical}`}>
                {q.type}
              </span>
            )}
            {q.difficulty && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.Medium}`}>
                {q.difficulty}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug pr-2">
            {q.question}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {open
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 ml-10">
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Sample Answer Guide
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {q.sampleAnswer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const InterviewPage = () => {
  const { resumes, currentResume, setCurrentResume } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedResume = currentResume;

  const handleGenerate = async () => {
    if (!selectedResume) return;
    setLoading(true);
    setError('');
    setQuestions([]);
    try {
      const data = await interviewAgent.generateQuestions(selectedResume, jobDescription);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const technicalCount = questions.filter(q => q.type === 'Technical').length;
  const behavioralCount = questions.filter(q => q.type === 'Behavioral').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-md">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Interview Prep</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI-generated STAR-method interview questions tailored to your resume</p>
        </div>
      </div>

      {/* Controls */}
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
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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

        {/* Optional job description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase">
            Job Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste the job description to get role-specific questions (highly recommended)…"
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
          />
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Star, label: 'STAR Method', text: 'Structure answers with Situation, Task, Action, Result', color: 'amber' },
          { icon: Zap, label: 'Be Specific', text: 'Use real examples with quantified impact wherever possible', color: 'indigo' },
          { icon: MessageSquare, label: 'Practice Aloud', text: 'Speaking answers out loud helps improve recall under pressure', color: 'violet' },
        ].map(({ icon: Icon, label, text, color }) => (
          <div key={label} className={`flex gap-3 p-3 rounded-xl bg-${color}-50 dark:bg-${color}-950/20 border border-${color}-100 dark:border-${color}-900/30`}>
            <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400 mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`text-xs font-bold text-${color}-700 dark:text-${color}-400`}>{label}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!selectedResume}
          loading={loading}
          className="flex items-center gap-2 px-6"
        >
          <Sparkles className="w-4 h-4" />
          Generate Interview Questions
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Questions */}
      <AnimatePresence>
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Stats bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {questions.length} Questions Generated
              </h2>
              <div className="flex gap-2 text-xs">
                {technicalCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-semibold">
                    {technicalCount} Technical
                  </span>
                )}
                {behavioralCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 font-semibold">
                    {behavioralCount} Behavioral
                  </span>
                )}
              </div>
            </div>

            {questions.map((q, i) => (
              <QuestionCard key={q.id || i} q={q} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
