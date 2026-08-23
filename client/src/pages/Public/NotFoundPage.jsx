import {
  ArrowLeft,
  Compass,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('404 - Page Not Found');
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = isAuthenticated && !user?.tenantId && user?.roleName === 'ADMIN';
  const dashboardLink = isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between selection:bg-black selection:text-yellow-300">
      {/* ─── HEADER BAR ────────────────────────────────────────────────────────── */}
      <header className="px-4 sm:px-8 py-4 border-b-4 border-black bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_#000]">
            ⚡
          </div>
          <span className="font-black text-lg tracking-tight uppercase dark:text-white">OmniManage</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to={isAuthenticated ? dashboardLink : '/'}
            className="inline-flex items-center gap-1.5 font-bold text-xs uppercase bg-yellow-300 text-black border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            {isAuthenticated ? <LayoutDashboard className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
            {isAuthenticated ? 'Dashboard' : 'Home'}
          </Link>
        </div>
      </header>

      {/* ─── 404 CONTENT ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="max-w-xl w-full text-center space-y-6 bg-white dark:bg-slate-900 border-4 border-black p-8 sm:p-12 rounded-3xl shadow-[8px_8px_0px_0px_#000]">
          {/* Big Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-400 border-3 border-black rounded-3xl shadow-[4px_4px_0px_0px_#000] text-3xl font-black text-black mx-auto">
            404
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Lost in Cyber Orbit?
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              The page or resource you are trying to access does not exist or may have been relocated.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isAuthenticated ? (
              <Link
                to={dashboardLink}
                className="inline-flex items-center gap-2 font-black text-xs uppercase bg-yellow-300 text-black border-2 border-black px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-400 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Workspace Dashboard
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-black text-xs uppercase bg-yellow-300 text-black border-2 border-black px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-400 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <Home className="w-4 h-4" /> Return to Homepage
              </Link>
            )}

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 font-bold text-xs uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-black px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:bg-slate-100 dark:hover:bg-slate-700 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <LifeBuoy className="w-4 h-4 text-cyan-500" /> Support Desk
            </Link>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-4 px-6 text-center text-xs font-bold text-slate-500 border-t-2 border-black/10 dark:border-white/10">
        OmniManage Gadget ERP Solution • Error Code: HTTP 404
      </footer>
    </div>
  );
}
