import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Mail,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentResume, logout, sandboxMode } = useResume();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation Links definition
  const generalLinks = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      description: 'All your resumes',
    }
  ];

  const activeResumeLinks = currentResume ? [
    {
      label: 'Edit details',
      icon: FileText,
      path: `/editor/${currentResume.id}/edit`,
      description: 'Resume details form',
    },
    {
      label: 'Live Preview',
      icon: Eye,
      path: `/editor/${currentResume.id}/preview`,
      description: 'PDF templates & export',
    },
    {
      label: 'ATS Optimizer',
      icon: ShieldCheck,
      path: `/editor/${currentResume.id}/ats`,
      description: 'ATS keywords & alignment',
    },
    {
      label: 'AI Chat Assistant',
      icon: MessageSquare,
      path: `/editor/${currentResume.id}/chat`,
      description: 'Direct AI editing chat',
    }
  ] : [];

  const toolLinks = [
    {
      label: 'Cover Letter',
      icon: Mail,
      path: '/cover-letter',
      description: 'Draft matching cover letter',
    },
    {
      label: 'Interview Prep',
      icon: BrainCircuit,
      path: '/interview',
      description: 'Practice mock interview Q&A',
    },
    {
      label: 'ATS Auditor',
      icon: ShieldCheck,
      path: '/ats',
      description: 'Scan standard resume file',
    }
  ];

  const renderLink = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none ${
          active
            ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400'
            : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        {/* Active indicator */}
        {active && (
          <span className="absolute left-0 w-1 h-6 bg-primary-600 rounded-r-full" />
        )}

        <Icon
          className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
            active ? 'text-primary-600 dark:text-primary-400' : ''
          }`}
        />

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden min-w-0 flex-1"
            >
              <span className="whitespace-nowrap text-[13px] block truncate">{item.label}</span>
              {!active && (
                <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500 leading-none mt-0.5 whitespace-nowrap truncate">
                  {item.description}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 h-full overflow-hidden z-30 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="text-[13px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight whitespace-nowrap">
                ResumeCraft AI
              </span>
              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                AI Resume Builder
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        
        {/* Section 1: General */}
        <div className="space-y-0.5">
          {generalLinks.map((item) => renderLink(item))}
        </div>

        {/* Section 2: Active Resume */}
        {currentResume && (
          <div className="space-y-0.5">
            {!collapsed ? (
              <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                Active: {currentResume.title || 'Resume'}
              </div>
            ) : (
              <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
            )}
            {activeResumeLinks.map((item) => renderLink(item))}
          </div>
        )}

        {/* Section 3: AI Tools */}
        <div className="space-y-0.5">
          {!collapsed ? (
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              AI Standalone Tools
            </div>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
          )}
          {toolLinks.map((item) => renderLink(item))}
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800/60 p-2">
        {(user || sandboxMode) && (
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap text-[13px]"
                >
                  {user ? 'Sign Out' : 'Exit Sandbox'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm z-50"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
};
