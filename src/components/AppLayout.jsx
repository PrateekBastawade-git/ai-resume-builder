import React from 'react';
import { Sidebar } from './Sidebar';
import { Taskbar } from './Taskbar';

/**
 * AppLayout — wraps all authenticated pages.
 * Layout: [Sidebar | [Taskbar / Content]]
 */
export const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Right Column: Taskbar + Page Content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top Taskbar */}
        <Taskbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
