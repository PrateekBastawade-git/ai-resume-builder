import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { useTheme } from '../context/ThemeContext';
import { Modal } from './Modal';
import { CredentialsSettings } from './CredentialsSettings';
import { Sun, Moon, Settings, CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const SaveIndicator = ({ status }) => {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        Saving…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        Save failed
      </span>
    );
  }
  return null;
};

export const Taskbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentResume, saveStatus, sandboxMode } = useResume();
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-12 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex-shrink-0">
      {/* Left: Current resume context */}
      <div className="flex items-center gap-3 overflow-hidden">
        {currentResume ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Editing:</span>
            <button
              onClick={() => navigate(`/editor/${currentResume.id}`)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title={currentResume.title}
            >
              {currentResume.title}
            </button>
            <SaveIndicator status={saveStatus} />
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium italic">No resume selected</span>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* Connection indicator */}
        {sandboxMode && !user ? (
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 mr-1">
            <WifiOff className="w-3 h-3" />
            Sandbox Mode
          </span>
        ) : user ? (
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 mr-1 max-w-[140px] truncate">
            <Wifi className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </span>
        ) : null}

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings */}
        {location.pathname !== '/' && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 relative"
            aria-label="API Settings"
          >
            <Settings className="w-4 h-4" />
            {sandboxMode && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Application Credentials Settings"
        size="md"
      >
        <CredentialsSettings onClose={() => setIsSettingsOpen(false)} />
      </Modal>
    </header>
  );
};
