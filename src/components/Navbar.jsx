import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import { Modal } from './Modal';
import { CredentialsSettings } from './CredentialsSettings';
import { Sun, Moon, Settings, LogOut, FileText, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, currentResume, logout, sandboxMode } = useResume();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-all duration-300">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                ResumeCraft AI
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                AI Resume Builder
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {user || sandboxMode ? (
              <>
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                    isActiveRoute('/') 
                      ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {currentResume && (
                  <Link
                    to={`/editor/${currentResume.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                      location.pathname.startsWith('/editor') 
                        ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Editor
                  </Link>
                )}
              </>
            ) : null}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Config Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 relative"
              aria-label="API Settings"
            >
              <Settings className="w-4.5 h-4.5" />
              {sandboxMode && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Auth options */}
            {(user || sandboxMode) && (
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            )}

            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Connected User
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:hover:bg-red-950/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            ) : sandboxMode ? (
              <div className="flex items-center gap-2">
                {!user && (
                  <Button
                    onClick={() => navigate('/login')}
                    variant="primary"
                    size="sm"
                    className="text-xs"
                  >
                    Sign In / Connect
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                size="sm"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
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
    </nav>
  );
};
