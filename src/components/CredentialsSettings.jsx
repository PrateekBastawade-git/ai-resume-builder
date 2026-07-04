import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { Button } from './Button';
import { Input } from './Input';

export const CredentialsSettings = ({ onClose }) => {
  const { reloadCredentials, sandboxMode } = useResume();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  // Load current inputs on mount
  useEffect(() => {
    setSupabaseUrl(localStorage.getItem('resume_builder_supabase_url') || '');
    setSupabaseKey(localStorage.getItem('resume_builder_supabase_anon_key') || '');
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    
    // Save to localStorage
    if (supabaseUrl.trim()) {
      localStorage.setItem('resume_builder_supabase_url', supabaseUrl.trim());
    } else {
      localStorage.removeItem('resume_builder_supabase_url');
    }

    if (supabaseKey.trim()) {
      localStorage.setItem('resume_builder_supabase_anon_key', supabaseKey.trim());
    } else {
      localStorage.removeItem('resume_builder_supabase_anon_key');
    }

    // Trigger state context re-initialization
    reloadCredentials();
    
    setStatusMessage({
      type: 'success',
      text: 'Configurations updated! Syncing services...'
    });

    setTimeout(() => {
      setStatusMessage(null);
      if (onClose) onClose();
    }, 1500);
  };

  const handleClear = () => {
    localStorage.removeItem('resume_builder_supabase_url');
    localStorage.removeItem('resume_builder_supabase_anon_key');
    
    setSupabaseUrl('');
    setSupabaseKey('');
    
    reloadCredentials();
    
    setStatusMessage({
      type: 'info',
      text: 'Custom configurations cleared. Reverting to sandbox.'
    });

    setTimeout(() => {
      setStatusMessage(null);
    }, 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 font-sans">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Active Connection Status:
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            sandboxMode 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50' 
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-900/50'
          }`}>
            {sandboxMode ? 'Offline Sandbox Mode' : 'Connected to Supabase'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {sandboxMode 
            ? 'Running locally. Your resumes are stored on this device only. To sync across devices and use real-time AI capabilities, enter your API credentials below.'
            : 'Using custom configurations to sync resumes and process live AI generation.'}
        </p>
      </div>

      <div className="space-y-3">
        <Input
          label="Supabase URL"
          id="supabaseUrl"
          value={supabaseUrl}
          onChange={(e) => setSupabaseUrl(e.target.value)}
          placeholder="https://your-project.supabase.co"
        />

        <Input
          label="Supabase Anon Key"
          id="supabaseKey"
          type="password"
          value={supabaseKey}
          onChange={(e) => setSupabaseKey(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        />
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg text-xs font-semibold ${
          statusMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40' 
            : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40'
        }`}>
          {statusMessage.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="text-xs"
        >
          Reset to Sandbox
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            Save & Connect
          </Button>
        </div>
      </div>
    </form>
  );
};
