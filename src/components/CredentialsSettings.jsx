import React from 'react';
import { useResume } from '../context/ResumeContext';
import { Button } from './Button';
import { CheckCircle2, Server } from 'lucide-react';

export const CredentialsSettings = ({ onClose }) => {
  const { sandboxMode } = useResume();

  return (
    <div className="space-y-4 font-sans">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary-500" />
            Backend Connection Status:
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            sandboxMode 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50' 
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-900/50'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {sandboxMode ? 'Offline Sandbox Mode' : 'Connected to Cloud'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {sandboxMode 
            ? 'Running in local sandbox mode. Resumes are stored on this device.'
            : 'Your application is securely connected to the cloud backend via production environment variables. Data automatically syncs across all your devices.'}
        </p>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="primary"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};
