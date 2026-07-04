import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Plus, Edit2, Copy, Trash2, Calendar, FileText, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { resumes, loading, createResume, copyResume, deleteResume, setCurrentResume } = useResume();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [newResumeTemplate, setNewResumeTemplate] = useState('professional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [resumeToDelete, setResumeToDelete] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newResumeTitle.trim()) return;

    setIsSubmitting(true);
    const resume = await createResume(newResumeTitle.trim(), newResumeTemplate);
    setIsSubmitting(false);
    
    if (resume) {
      setIsCreateModalOpen(false);
      setNewResumeTitle('');
      navigate(`/editor/${resume.id}`);
    }
  };

  const handleEdit = (resume) => {
    setCurrentResume(resume);
    navigate(`/editor/${resume.id}`);
  };

  const handleCopy = async (id) => {
    await copyResume(id);
  };

  const handleDeleteConfirm = async () => {
    if (resumeToDelete) {
      await deleteResume(resumeToDelete);
      setResumeToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your Professional Resumes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, manage, and optimize your resume layouts using AI features.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 shadow-md shadow-primary-500/10"
        >
          <Plus className="w-4 h-4" />
          Create New Resume
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your resumes...</span>
          </div>
        </div>
      ) : resumes.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-500 mb-4 ring-8 ring-primary-50/50 dark:ring-primary-950/10">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No resumes created yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
            Kickstart your application journey! Create your first layout, select a professional style, and let AI enhance your bullet points.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create My First Resume
          </Button>
        </motion.div>
      ) : (
        /* Resume List Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume, idx) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl shadow-sm hover:shadow-md transition duration-200 overflow-hidden"
            >
              {/* Card Thumbnail Area */}
              <div className="h-32 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition duration-300" />
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 group-hover:scale-105 transition duration-300" />
                
                {/* Template badge */}
                <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {resume.template === 'professional' ? 'Corporate Professional' : 'Modern Minimalist'}
                </span>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {resume.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Edited {formatDate(resume.updated_at)}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 justify-end">
                  <button
                    onClick={() => handleEdit(resume)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150"
                    title="Edit Resume"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(resume.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150"
                    title="Duplicate / Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setResumeToDelete(resume.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition duration-150"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Resume"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Resume Title"
            id="resumeTitle"
            value={newResumeTitle}
            onChange={(e) => setNewResumeTitle(e.target.value)}
            placeholder="e.g. Senior React Developer - July 2026"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
              Select Starting Template
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col p-4 rounded-xl border cursor-pointer select-none transition ${
                newResumeTemplate === 'professional'
                  ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10 ring-2 ring-primary-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="templateSelect"
                  value="professional"
                  checked={newResumeTemplate === 'professional'}
                  onChange={() => setNewResumeTemplate('professional')}
                  className="sr-only"
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Corporate Professional</span>
                <span className="text-xs text-slate-400 mt-1 leading-relaxed">ATS-friendly, left-aligned standard layout.</span>
              </label>

              <label className={`flex flex-col p-4 rounded-xl border cursor-pointer select-none transition ${
                newResumeTemplate === 'modern'
                  ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10 ring-2 ring-primary-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="templateSelect"
                  value="modern"
                  checked={newResumeTemplate === 'modern'}
                  onChange={() => setNewResumeTemplate('modern')}
                  className="sr-only"
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Modern Minimalist</span>
                <span className="text-xs text-slate-400 mt-1 leading-relaxed">Two-column layout with sleek sidebar columns.</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!newResumeTitle.trim()}
            >
              Create Resume
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!resumeToDelete}
        onClose={() => setResumeToDelete(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete this resume? This action is permanent and cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setResumeToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
