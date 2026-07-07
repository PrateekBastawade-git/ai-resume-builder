import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Plus, Edit2, Copy, Trash2, Calendar, FileText, Sparkles, ExternalLink, Upload, Search, Filter, Layout } from 'lucide-react';
import { motion } from 'framer-motion';
import { importAndDetectLayout } from '../../ai/agent/importAgent';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { resumes, loading, createResume, copyResume, deleteResume, setCurrentResume } = useResume();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [newResumeTemplate, setNewResumeTemplate] = useState('professional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [resumeToDelete, setResumeToDelete] = useState(null);

  // Import Resume states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('Imported Resume');
  const [isImporting, setIsImporting] = useState(false);

  // Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'title' | 'template'

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name) {
      setImportTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result || '');
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const importedData = await importAndDetectLayout(importText, importTitle);
      const templateToUse = importedData.template || 'professional';
      const resume = await createResume(importTitle.trim() || 'Imported Resume', templateToUse, importedData);
      setIsImporting(false);
      if (resume) {
        setIsImportModalOpen(false);
        setImportText('');
        setImportTitle('Imported Resume');
        navigate(`/editor/${resume.id}`);
      }
    } catch (err) {
      console.error("Import error:", err);
      setIsImporting(false);
    }
  };

  const filteredResumes = resumes.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (r.title || '').toLowerCase().includes(q);
    const tmplMatch = (r.template || '').toLowerCase().includes(q);
    const nameMatch = (r.personalInfo?.name || '').toLowerCase().includes(q);
    return titleMatch || tmplMatch || nameMatch;
  }).sort((a, b) => {
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (sortBy === 'template') {
      return (a.template || '').localeCompare(b.template || '');
    }
    // Default: date
    return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
  });

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
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Upload className="w-4 h-4 text-primary-500" />
            Import Resume
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4 h-4" />
            Create New Resume
          </Button>
        </div>
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Upload className="w-4 h-4 text-primary-500" />
              Import Existing Resume
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 shadow-md shadow-primary-500/10"
            >
              <Plus className="w-4 h-4" />
              Create My First Resume
            </Button>
          </div>
        </motion.div>
      ) : (
        /* Resume List Grid with Search & Sort */
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resumes by title, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="date">Last Modified</option>
                <option value="title">Title (A-Z)</option>
                <option value="template">Template</option>
              </select>
            </div>
          </div>

          {filteredResumes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No resumes found matching "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResumes.map((resume, idx) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl shadow-sm hover:shadow-md transition duration-200 overflow-hidden"
                >
                  {/* Card Thumbnail Area */}
                  <div className="h-36 bg-slate-100 dark:bg-slate-800/60 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-800 relative overflow-hidden group-hover:bg-slate-200/50 dark:group-hover:bg-slate-800 transition duration-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition duration-300" />
                    
                    {/* Mini Visual Preview Simulation */}
                    <div className="w-24 h-32 bg-white dark:bg-slate-900 shadow-md rounded border border-slate-200 dark:border-slate-700 p-2 flex flex-col gap-1 transform group-hover:scale-105 transition duration-300">
                      <div className="w-12 h-1.5 bg-primary-500 rounded-full mb-1" />
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <div className="w-3/4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-1" />
                      <div className="flex gap-1 flex-1">
                        <div className="w-full space-y-1">
                          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded" />
                          <div className="w-5/6 h-1 bg-slate-100 dark:bg-slate-800 rounded" />
                          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Template badge */}
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Layout className="w-2.5 h-2.5 text-primary-500" />
                      {resume.template || 'Professional'}
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

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Resume & Detect Layout"
        size="md"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <Input
            label="Resume Title"
            id="importTitle"
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
            placeholder="e.g. Imported Resume"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
              Upload File (.txt, .md, .csv)
            </label>
            <input
              type="file"
              accept=".txt,.md,.csv,.doc,.docx"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-950 dark:file:text-primary-300 border border-slate-200 dark:border-slate-800 rounded-lg p-1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Or Paste Resume Text Below</span>
              <span className="text-[10px] text-primary-500 font-normal">AI will auto-detect sections & layout style</span>
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your full resume text here..."
              rows={6}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isImporting}
              disabled={!importText.trim()}
            >
              Import & Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
