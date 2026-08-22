import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 GlobeTrotter Inc. Plan smarter. Travel better.</p>
          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <span>MERN Stack Architecture</span>
            <span>•</span>
            <span>Odoo Hackathon 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
