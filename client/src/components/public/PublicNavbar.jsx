import {
  ArrowRight,
  BookOpen,
  Boxes,
  Code2,
  Cpu,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  Menu,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

export default function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = isAuthenticated && !user?.tenantId && user?.roleName === 'ADMIN';
  const dashboardLink = isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const handleNavClick = (e, href) => {
    if (href.startsWith('#') || href.includes('#')) {
      const [path, targetId] = href.includes('#') ? href.split('#') : ['', href.replace('#', '')];
      const currentPath = location.pathname;

      if (path && path !== currentPath) {
        // Navigate to the target page with hash
        navigate(href);
        return;
      }

      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${href.startsWith('#') ? href : ''}`);
      }
    }
  };

  const navLinks = [
    { name: 'Home', href: '/', isRoute: true },
    { name: 'Features', href: '/#features', isRoute: false },
    { name: 'Modules', href: '/#modules', isRoute: false },
    { name: 'Pricing', href: '/#pricing', isRoute: false },
    { name: 'About', href: '/about', isRoute: true },
    { name: 'Developer', href: '/developer', isRoute: true },
    { name: 'Contact', href: '/contact', isRoute: true },
  ];

  const isActive = (item) => {
    if (item.isRoute) {
      if (item.href === '/') {
        return location.pathname === '/' && !location.hash;
      }
      return location.pathname === item.href;
    }
    return location.hash === item.href.replace('/', '');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5'
          : 'bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-b border-slate-200/30 dark:border-slate-800/30'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-blue-200 bg-clip-text text-transparent">
                  OmniManage
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md">
                  ERP
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">
                Gadget & Electronics Suite
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/60 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                  isActive(item)
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <Link
                to={dashboardLink}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all duration-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
                <ArrowRight className="w-3 h-3 opacity-80" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900/70 rounded-xl transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register-shop"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Register Shop</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  isActive(item)
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{item.name}</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to={dashboardLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Sign In to Your Shop</span>
                </Link>
                <Link
                  to="/register-shop"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/20"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Register Your Shop (Free Trial)</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
