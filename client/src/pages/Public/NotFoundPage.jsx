import {
  ArrowLeft,
  Compass,
  FileQuestion,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ScrollReveal from '../../components/public/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('404 - Page Not Found | OmniManage');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = isAuthenticated && !user?.tenantId && user?.roleName === 'ADMIN';
  const dashboardLink = isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 font-sans overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        {/* Animated 404 Visual Pill */}
        <ScrollReveal animation="zoom-in" duration={600}>
          <div className="relative inline-flex items-center justify-center">
            <div className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent opacity-90 select-none">
              404
            </div>
            <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-md">
              Lost in Space
            </div>
          </div>
        </ScrollReveal>

        {/* Message */}
        <ScrollReveal animation="fade-up" delay={150}>
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Device Not Found in Network
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              The page, serial record, or route you requested might have been decommissioned, moved, or never
              existed in this database.
            </p>
          </div>
        </ScrollReveal>

        {/* Action Buttons */}
        <ScrollReveal animation="fade-up" delay={300}>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>

            {isAuthenticated && (
              <Link
                to={dashboardLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>ERP Dashboard</span>
              </Link>
            )}
          </div>
        </ScrollReveal>

        {/* Quick Help Card */}
        <ScrollReveal animation="fade" delay={450}>
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-xs text-slate-500">
              Need urgent assistance or looking for support?{' '}
              <Link to="/contact" className="font-bold text-blue-600 hover:underline">
                Contact OmniManage Help Desk
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
