import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col antialiased">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top navigation header */}
        <Topbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Dashboard Minimal Footer */}
        <footer className="border-t border-emerald-950/40 py-4 px-6 text-center text-xs text-slate-400">
          ReCarbo v1.0 • Circular Carbon Ecosystem Platform • Built by The Outliers
        </footer>
      </div>
    </div>
  );
};
