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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#9CE700] text-black shadow-lg shadow-[#9CE700]/25 group-hover:scale-105 transition-all duration-300">
              <Smartphone className="w-5 h-5 text-black stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9CE700] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9CE700] border-2 border-black" />
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Omni<span className="text-[#9CE700]">Manage</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#9CE700]/15 text-[#7dbb00] dark:text-[#9CE700] border border-[#9CE700]/30 rounded-md">
                  ERP
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#8892B0] -mt-0.5">
                Gadget & Electronics Suite
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-[#121524] p-1.5 rounded-full border border-slate-200/80 dark:border-white/10">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-3.5 py-1.5 text-xs rounded-full transition-all duration-200 ${
                  isActive(item)
                    ? 'bg-[#9CE700] text-black font-extrabold shadow-sm shadow-[#9CE700]/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-[#9CE700] hover:bg-white/80 dark:hover:bg-[#171a2d] font-semibold'
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
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-black bg-[#9CE700] hover:bg-[#8fd500] rounded-xl shadow-md shadow-[#9CE700]/25 active:scale-95 transition-all duration-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Dashboard</span>
                <ArrowRight className="w-3 h-3 text-black stroke-[2.5]" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#7dbb00] dark:hover:text-[#9CE700] hover:bg-slate-100 dark:hover:bg-[#171a2d] rounded-xl transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register-shop"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-black bg-[#9CE700] hover:bg-[#8fd500] active:scale-95 rounded-xl shadow-md shadow-[#9CE700]/25 transition-all duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black stroke-[2.5]" />
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
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#171a2d] border border-slate-200 dark:border-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-[#121524] backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  isActive(item)
                    ? 'bg-[#9CE700] text-black font-extrabold'
                    : 'bg-slate-100/80 dark:bg-[#171a2d] text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{item.name}</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to={dashboardLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black text-black bg-[#9CE700] hover:bg-[#8fd500] shadow-md shadow-[#9CE700]/25"
              >
                <LayoutDashboard className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-[#171a2d] border border-slate-200 dark:border-white/10"
                >
                  <LogIn className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Sign In to Your Shop</span>
                </Link>
                <Link
                  to="/register-shop"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black text-black bg-[#9CE700] hover:bg-[#8fd500] shadow-md shadow-[#9CE700]/25"
                >
                  <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
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
