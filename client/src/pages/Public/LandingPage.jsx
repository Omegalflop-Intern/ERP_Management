import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  GitBranch,
  Receipt,
  Wrench,
  BadgePercent,
  Building2,
  DollarSign,
  PhoneCall,
  Mail,
  MapPin,
  Send,
  Star,
  Check,
  ChevronRight,
  Sparkles,
  Lock,
  Globe,
  Headphones,
  Award,
  Layers,
  Box,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Menu,
  X,
  ChevronUp,
  Code,
  Heart,
  ArrowUpRight,
  Shield,
  Truck,
  Package,
  ClipboardList,
  FileText,
  Scale,
  Wallet,
  Landmark,
  BookOpen,
  Contact,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../../lib/api';

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2200 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp = null;
    const target = typeof end === 'number' ? end : parseFloat(end) || 0;
    const isDecimal = String(end).includes('.');

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Smooth ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = easeProgress * target;

      setCount(isDecimal ? parseFloat(currentVal.toFixed(1)) : Math.floor(currentVal));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {typeof count === 'number' ? count.toLocaleString() : count}
      {suffix}
    </span>
  );
}

function TypewriterText({
  words = [],
  typingSpeed = 90,
  deletingSpeed = 45,
  pauseDuration = 2200,
}) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (!words.length) return;
    const currentWord = words[index];

    if (isDeleting) {
      if (subIndex === 0) {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
        return;
      }
      const timeout = setTimeout(() => {
        setSubIndex((prev) => prev - 1);
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    }

    if (subIndex === currentWord.length) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + 1);
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting, words, typingSpeed, deletingSpeed, pauseDuration]);

  const currentWord = words[index] || '';

  return (
    <span className="inline-block">
      <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent font-black drop-shadow-[0_4px_20px_rgba(56,189,248,0.4)]">
        {currentWord.substring(0, subIndex)}
      </span>
      <span
        className={`inline-block w-1.5 h-8 sm:h-12 lg:h-16 ml-1.5 align-middle bg-cyan-400 shadow-[0_0_12px_#38bdf8] rounded-full transition-opacity ${
          blink ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </span>
  );
}

const sampleSalesData = [
  { day: 'Mon', revenue: 42000, sales: 28 },
  { day: 'Tue', revenue: 58000, sales: 36 },
  { day: 'Wed', revenue: 51000, sales: 31 },
  { day: 'Thu', revenue: 79000, sales: 48 },
  { day: 'Fri', revenue: 94000, sales: 62 },
  { day: 'Sat', revenue: 112000, sales: 79 },
  { day: 'Sun', revenue: 86000, sales: 54 },
];

function HeroDashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl md:rounded-[28px] bg-slate-900/90 border border-white/10 p-4 md:p-6 shadow-2xl backdrop-blur-2xl overflow-hidden text-left">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold hidden sm:inline">
            OmniManage ERP v4.2 • Multi-Branch Outlet Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
            Stock Sync
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Today's Revenue
          </div>
          <div className="text-base sm:text-lg font-black text-white mt-0.5">৳ 94,250</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">↑ +18.4% vs yesterday</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Active Outlets
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-400 mt-0.5">5 Outlets</div>
          <div className="text-[10px] text-indigo-300 font-bold mt-0.5">100% Operational</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            IMEI Items In Stock
          </div>
          <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">1,420 Pcs</div>
          <div className="text-[10px] text-amber-300/80 font-bold mt-0.5">Passport Tracked</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Active Repairs
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">14 Jobs</div>
          <div className="text-[10px] text-slate-400 font-bold mt-0.5">Avg turn: 24 hrs</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Weekly Revenue Curve
            </h4>
            <span className="text-[10px] text-indigo-400 font-bold">Real-time Sales</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampleSalesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `৳${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`৳${val.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Branch Stock Health
          </h4>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 font-medium">Dhanmondi Main</span>
              <span className="text-emerald-400 font-bold">92%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 font-medium">Mirpur Outlet</span>
              <span className="text-blue-400 font-bold">78%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 font-medium">Uttara Outlet</span>
              <span className="text-amber-400 font-bold">64%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 font-medium">Chittagong Outlet</span>
              <span className="text-indigo-400 font-bold">85%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BRAND = {
  primary: 'indigo',
  accent: 'violet',
  gradient: 'from-indigo-600 to-violet-600',
  gradientHover: 'hover:from-indigo-500 hover:to-violet-500',
  text: 'text-indigo-400',
  textStrong: 'text-indigo-500',
  bg: 'bg-indigo-600',
  bgHover: 'hover:bg-indigo-500',
  border: 'border-indigo-500/30',
  ring: 'ring-indigo-500/40',
  shadow: 'shadow-indigo-600/20',
  badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    shopName: '',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'OmniManage ERP',
    platformPhone: '+880 1700-000000',
    platformEmail: 'support@omnimanage.bd',
    platformAddress: 'Dhanmondi, Dhaka, Bangladesh',
    platformSocials: {
      facebook: 'https://facebook.com/omnimanage',
      twitter: 'https://x.com/omnimanage',
      linkedin: 'https://linkedin.com/company/omnimanage',
      youtube: 'https://youtube.com/@omnimanage',
      instagram: 'https://instagram.com/omnimanage',
    },
  });

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        if (res.data?.data) {
          setPlatformSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch {}
    };
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const fetchPlans = async () => {
      setPlansLoading(true);
      try {
        const res = await api.get('/plans');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setPlans(res.data.data);
        }
      } catch {
        setPlans([
          {
            name: 'Free',
            priceMonthly: 0,
            priceYearly: 0,
            description: 'Ideal for single-person mobile setups getting started.',
            features: [
              '1 Branch / Outlet',
              '2 Staff Users',
              'Up to 500 Products',
              'POS Billing',
              'Basic Sales Reports',
            ],
            isPopular: false,
          },
          {
            name: 'Starter',
            priceMonthly: 999,
            priceYearly: 9990,
            description: 'Perfect for growing mobile shops needing IMEI tracking.',
            features: [
              '2 Branches',
              '5 Staff Users',
              '2,000 Products & IMEIs',
              'IMEI History Passport',
              'Customer Due SMS',
              'Repair Sheets',
            ],
            isPopular: false,
          },
          {
            name: 'Pro',
            priceMonthly: 2499,
            priceYearly: 24990,
            description: 'Complete ERP suite for multi-branch mobile businesses.',
            features: [
              '5 Branches',
              '20 Staff Users',
              '10,000 IMEIs',
              'Double-Entry Accounting',
              'HR & Payroll',
              'Wholesale Tiers',
              '24/7 Priority Support',
            ],
            isPopular: true,
          },
          {
            name: 'Enterprise',
            priceMonthly: 'Custom',
            priceYearly: 'Custom',
            description: 'Unlimited capacity & dedicated setup for large franchises.',
            features: [
              'Unlimited Branches',
              'Unlimited Users',
              'Custom Domain Support',
              'API Access',
              'Dedicated Account Manager',
              'SLA Uptime Guarantee',
            ],
            isPopular: false,
          },
        ]);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone || !contactForm.message) {
      toast.error('Please fill in your name, phone number, and message.');
      return;
    }
    setContactSubmitting(true);
    try {
      const res = await api.post('/contact', contactForm);
      if (res.data?.success) {
        toast.success('Thank you! Your message has been sent to our team.');
        setContactForm({ name: '', phone: '', email: '', shopName: '', message: '' });
      } else {
        toast.error(res.data?.message || 'Submission failed. Please try again.');
      }
    } catch {
      toast.error('Could not submit inquiry. Please check your network.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const [pagesDropdownOpen, setPagesDropdownOpen] = useState(false);

  const mainNavLinks = [
    { id: 'home', label: 'Home', icon: Layers, isScroll: true },
    { id: 'features', label: 'Features', icon: Zap, isScroll: true },
    { id: 'modules', label: 'Modules', icon: Box, isScroll: true },
    { id: 'pricing', label: 'Pricing', icon: CreditCard, isScroll: true },
  ];

  const publicPageLinks = [
    { label: 'About Us', to: '/about', icon: Building2, desc: 'Our mission, vision & gadget ERP story' },
    { label: 'Contact Support', to: '/contact', icon: MessageSquare, desc: 'Sales inquiries & 24/7 technical help' },
    { label: 'Developer Profile', to: '/developer', icon: Code, desc: 'Architect portfolio & tech stack' },
    { label: 'Terms of Service', to: '/terms', icon: Scale, desc: 'SaaS licensing & tenant guidelines' },
    { label: 'Privacy Policy', to: '/privacy', icon: Shield, desc: 'Data encryption & isolation protocols' },
    { label: 'Refund Policy', to: '/refund', icon: FileText, desc: 'Subscription billing & refund terms' },
  ];

  const scrollTo = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setPagesDropdownOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ─── FLOATING ROUNDED NAVBAR ──────────────────────────────────────── */}
      <header
        className={`sticky top-3 sm:top-5 z-50 max-w-7xl mx-2 sm:mx-auto px-3 sm:px-6 bg-[#0a0a1a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-indigo-600/10 transition-all ${
          mobileMenuOpen ? 'rounded-2xl sm:rounded-3xl' : 'rounded-full'
        }`}
      >
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          <button
            onClick={() => scrollTo('home')}
            className="flex items-center gap-2 sm:gap-2.5 group text-left shrink-0 min-w-0"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/40 transition-shadow shrink-0">
              O
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-black text-sm sm:text-lg tracking-tight text-white leading-tight truncate">
                Omni<span className="text-indigo-400">Manage</span>
              </span>
              <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 tracking-widest uppercase hidden xs:inline-block sm:block">
                Enterprise ERP
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-full">
            {mainNavLinks.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollTo(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-[11px] transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}

            <Link
              to="/about"
              className="px-3.5 py-1.5 rounded-full font-bold text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Building2 className="h-3.5 w-3.5" />
              About
            </Link>

            <Link
              to="/contact"
              className="px-3.5 py-1.5 rounded-full font-bold text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Contact
            </Link>

            {/* Pages & Legal Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPagesDropdownOpen(!pagesDropdownOpen)}
                className="px-3.5 py-1.5 rounded-full font-bold text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                <span>Legal & Pages</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    pagesDropdownOpen ? 'rotate-90 text-indigo-400' : ''
                  }`}
                />
              </button>

              {pagesDropdownOpen && (
                <div
                  onMouseLeave={() => setPagesDropdownOpen(false)}
                  className="absolute right-0 top-full mt-2 w-64 p-2 bg-[#0e0e24] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50"
                >
                  <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5">
                    Platform Documentation & Legal
                  </div>
                  {publicPageLinks.map((p) => {
                    const Icon = p.icon;
                    return (
                      <Link
                        key={p.to}
                        to={p.to}
                        onClick={() => setPagesDropdownOpen(false)}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
                      >
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {p.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight truncate">
                            {p.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/login"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
            <Link
              to="/register-shop"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Register Shop</span>
              <span className="sm:hidden">Register</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative p-2 sm:px-3 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-sky-500/20 border border-indigo-400/30 text-white shadow-lg shadow-indigo-500/10 hover:border-indigo-400/60 active:scale-95 transition-all duration-300 flex items-center justify-center shrink-0"
              aria-label="Toggle mobile navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-rose-400 stroke-[2.5]" />
              ) : (
                <div className="flex items-center gap-1 px-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2 flex items-center justify-between">
                <span>Landing Sections</span>
                <span className="text-[9px] text-indigo-400 font-extrabold">OmniManage ERP</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {mainNavLinks.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => scrollTo(tab.id)}
                      className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Public Pages & Legal
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {publicPageLinks.map((p) => {
                  const Icon = p.icon;
                  return (
                    <Link
                      key={p.to}
                      to={p.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all text-xs font-semibold"
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span>{p.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-center text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register-shop"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-center text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Register Shop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section id="home" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            #1 Enterprise Business ERP & Multi-Branch POS Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1] text-white">
            Unified Management for{' '}
            <TypewriterText
              words={[
                'Inventory, IMEIs & Sales',
                'Multi-Branch Outlets & POS',
                'Double-Entry Accounting',
                'Warranty Claims & Repair Sheets',
                'Wholesale Tiers & Serial Tracking',
              ]}
            />
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Built for mobile phone stores, retail chains, repair centers & wholesale distributors.
            Real-time IMEI tracking, thermal billing, inter-branch transfers & double-entry
            accounting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register-shop"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              Start Free 14-Day Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Your Shop
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-400">
            {[
              'IMEI Lifetime Passport',
              'Multi-Branch Stock Sync',
              'SMS & Thermal Invoices',
              'Double-Entry Accounting',
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                {f}
              </div>
            ))}
          </div>

          <div className="pt-10 max-w-5xl mx-auto">
            <HeroDashboardMockup />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase">
              <Zap className="h-3.5 w-3.5" />
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Why Business Leaders Choose{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                OmniManage
              </span>
            </h2>
            <p className="text-slate-400 text-sm">
              Eliminate stock leakage, IMEI confusion, repair delays & uncollected credit balances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: 'IMEI & Serial Passport',
                desc: 'Scan or input device IMEIs. Access complete history: purchase cost, sales invoice, repair logs & warranty claims.',
              },
              {
                icon: Receipt,
                title: 'High-Speed POS & SMS',
                desc: 'Barcode scanner checkout, instant thermal billing, credit dues tracking & automated SMS receipt links.',
              },
              {
                icon: GitBranch,
                title: 'Multi-Branch Inventory Sync',
                desc: 'Manage multiple outlets. Transfer inventory seamlessly with delivery verification & real-time stock sync.',
              },
              {
                icon: ShieldCheck,
                title: 'Bank-Grade Security',
                desc: 'Strict multi-tenant isolation, encrypted connections, automated backups & role-based access control.',
              },
              {
                icon: BarChart3,
                title: 'Double-Entry Accounting',
                desc: 'Chart of accounts, general ledger, trial balance, profit & loss, and balance sheet statements.',
              },
              {
                icon: Headphones,
                title: '24/7 Dedicated Support',
                desc: 'Our team assists with bulk catalog migration, thermal printer setup & staff onboarding training.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODULES ─────────────────────────────────────────────── */}
      <section id="modules" className="py-20 sm:py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase">
              <Box className="h-3.5 w-3.5" />
              Full Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              32 Enterprise Modules in One Platform
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, name: 'Double-Entry Accounting' },
              { icon: Receipt, name: 'Sales & POS' },
              { icon: Package, name: 'Product Catalog' },
              { icon: Smartphone, name: 'IMEI Tracker' },
              { icon: GitBranch, name: 'Stock Transfer' },
              { icon: Users, name: 'Customer CRM' },
              { icon: Contact, name: 'Supplier Manager' },
              { icon: Truck, name: 'Purchase Orders' },
              { icon: Wrench, name: 'Repair Services' },
              { icon: Shield, name: 'Warranty Claims' },
              { icon: DollarSign, name: 'Expenses & Costing' },
              { icon: Wallet, name: 'Investor & Loans' },
              { icon: Landmark, name: 'Chart of Accounts' },
              { icon: BookOpen, name: 'Journal Entries' },
              { icon: Scale, name: 'Balance Sheet' },
              { icon: FileText, name: 'Profit & Loss' },
              { icon: ClipboardList, name: 'HR & Payroll' },
              { icon: Users, name: 'Attendance' },
              { icon: FileText, name: 'Leave Management' },
              { icon: BadgePercent, name: 'Wholesale Tiers' },
              { icon: Building2, name: 'Branch Management' },
              { icon: Globe, name: 'User Roles & Permissions' },
              { icon: Lock, name: 'Audit Logs' },
              { icon: Award, name: 'Notifications & Alerts' },
            ].map(({ icon: Icon, name }) => (
              <div
                key={name}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all flex items-center gap-3"
              >
                <Icon className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase">
              <CreditCard className="h-3.5 w-3.5" />
              Transparent Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Simple Plans for Every Business
            </h2>
            <p className="text-slate-400 text-sm">
              Start with our 14-day free trial. Plans loaded from our system database.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <span
                className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-7 rounded-full bg-white/10 p-0.5 transition-colors relative"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-transform shadow-md ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
              <span
                className={`text-xs font-bold flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                Yearly
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black uppercase">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {plansLoading ? (
            <div className="p-12 text-center text-sm font-bold text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
              Loading plans...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan, i) => {
                const monthlyPrice = plan.monthlyPrice ?? plan.priceMonthly;
                const yearlyPrice = plan.yearlyPrice ?? plan.priceYearly;
                const isPop = plan.isPopular || plan.popular;
                const isEnterprise = plan.name === 'ENTERPRISE' || (!monthlyPrice && plan.name !== 'FREE');
                const isFree = plan.name === 'FREE' && !monthlyPrice;

                return (
                  <div
                    key={i}
                    className={`relative rounded-2xl p-6 bg-white/[0.02] border flex flex-col justify-between space-y-5 transition-all duration-300 hover:-translate-y-1 ${
                      isPop
                        ? 'border-indigo-500/50 shadow-xl shadow-indigo-600/10'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {isPop && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                        Most Popular
                      </div>
                    )}
                    <div className="space-y-3">
                      <h3 className="text-xl font-black text-white">
                        {plan.displayName || plan.name}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
                      <div className="pt-1 min-h-[58px] flex flex-col justify-center">
                        {isEnterprise ? (
                          <div>
                            <div className="text-2xl font-black text-amber-400">
                              Contact for Pricing
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              Tailored enterprise SLA & custom setups
                            </div>
                          </div>
                        ) : isFree ? (
                          <div>
                            <div className="text-3xl font-black text-white">Free</div>
                            <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                              Free forever • No credit card required
                            </div>
                          </div>
                        ) : billingCycle === 'yearly' ? (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-white">
                                {typeof yearlyPrice === 'number'
                                  ? `৳${yearlyPrice.toLocaleString()}`
                                  : typeof monthlyPrice === 'number'
                                    ? `৳${(monthlyPrice * 12).toLocaleString()}`
                                    : monthlyPrice}
                              </span>
                              {typeof (yearlyPrice || monthlyPrice) === 'number' && (
                                <span className="text-xs font-bold text-indigo-400"> / year</span>
                              )}
                            </div>
                            {typeof yearlyPrice === 'number' && yearlyPrice > 0 && (
                              <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                                ৳{Math.round(yearlyPrice / 12).toLocaleString()}/mo • Billed
                                annually (Save 20%)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-white">
                                {typeof monthlyPrice === 'number'
                                  ? `৳${monthlyPrice.toLocaleString()}`
                                  : monthlyPrice}
                              </span>
                              {typeof monthlyPrice === 'number' && (
                                <span className="text-xs font-semibold text-slate-400">
                                  {' '}
                                  / month
                                </span>
                              )}
                            </div>
                            {typeof monthlyPrice === 'number' && monthlyPrice > 0 && (
                              <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                Billed monthly (No lock-in contract)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <ul className="space-y-2 pt-3 border-t border-white/5 text-xs text-slate-300">
                        {Array.isArray(plan.features) &&
                          plan.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <Link
                      to={isEnterprise ? '/contact' : '/register-shop'}
                      className={`w-full py-3 rounded-xl font-bold text-xs text-center transition-all ${
                        isPop
                          ? 'text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/20'
                          : isEnterprise
                            ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                            : 'text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {isEnterprise ? 'Contact Sales' : isFree ? 'Get Started Free' : 'Start 14-Day Free Trial'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────────────── */}
      <section id="about" className="py-20 sm:py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase">
                <Building2 className="h-3.5 w-3.5" />
                About OmniManage
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Empowering Modern Businesses Across Bangladesh
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                OmniManage was created to provide a robust, unified ERP platform for enterprise
                retail chains, franchises, and mobile businesses. Generic legacy software fails to
                account for complex IMEI lifecycles, inter-branch stock transfers, or double-entry
                financial controls.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our platform delivers audit-grade financial reporting, real-time multi-tenant data
                protection, local language SMS billing, and dedicated 24/7 technical support.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {[
                  { count: 10000, suffix: '+', label: 'Outlets Tracked' },
                  { count: 500000, suffix: '+', label: 'Invoices Issued' },
                  { count: 99.9, suffix: '%', label: 'Uptime SLA' },
                  { count: 50000, suffix: '+', label: 'Repairs Managed' },
                ].map(({ count, suffix, label }) => (
                  <div
                    key={label}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center"
                  >
                    <div className="text-xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                      <AnimatedCounter end={count} suffix={suffix} />
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Bank-Grade Isolation',
                  desc: 'Strict multi-tenant security, encrypted connections & automated database backups.',
                },
                {
                  icon: Headphones,
                  title: 'Dedicated Onboarding',
                  desc: 'Our team assists with bulk Excel catalog migration, thermal printing & staff training.',
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast POS',
                  desc: 'Sub-second barcode scan checkout, instant thermal invoices & real-time inventory sync.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────────────────────── */}
      <section id="contact" className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase">
              <MessageSquare className="h-3.5 w-3.5" />
              Contact Support
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Get in Touch with{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                OmniManage
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[
                {
                  icon: PhoneCall,
                  label: 'Call Us',
                  value: platformSettings.platformPhone,
                  sub: 'Sat - Thu, 9 AM - 8 PM',
                },
                {
                  icon: Mail,
                  label: 'Email Support',
                  value: platformSettings.platformEmail,
                  sub: 'Monitored 24/7',
                },
                {
                  icon: MapPin,
                  label: 'Headquarters',
                  value: platformSettings.platformAddress,
                  sub: '',
                },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                    {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahim Uddin"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="01700000000"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Shop / Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Star Mobile Store"
                      value={contactForm.shopName}
                      onChange={(e) => setContactForm({ ...contactForm, shopName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us about your business or inquiry..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#06060f] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-600/20">
                  O
                </div>
                <span className="font-black text-xl text-white tracking-tight">
                  Omni<span className="text-indigo-400">Manage</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                The leading enterprise cloud ERP & POS platform for retail stores, mobile shops,
                repair centers & wholesale distributors in Bangladesh.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                {['home', 'features', 'modules', 'pricing', 'about', 'contact'].map((id) => (
                  <li key={id}>
                    <button
                      onClick={() => scrollTo(id)}
                      className="hover:text-indigo-400 hover:translate-x-1 transition-all capitalize"
                    >
                      {id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                Company & Legal
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li>
                  <Link to="/about" className="hover:text-indigo-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-indigo-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-indigo-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-indigo-400 transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-indigo-400 transition-colors">
                    Contact & Support
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                Account & Systems
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li>
                  <Link to="/login" className="hover:text-indigo-400 transition-colors">
                    Sign In to Shop
                  </Link>
                </li>
                <li>
                  <Link to="/register-shop" className="hover:text-indigo-400 transition-colors">
                    Register New Shop
                  </Link>
                </li>
                <li>
                  <Link to="/super-admin" className="hover:text-indigo-400 transition-colors">
                    Super Admin Panel
                  </Link>
                </li>
                <li>
                  <Link to="/developer" className="hover:text-indigo-400 transition-colors">
                    Developer Portfolio
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                Contact & Socials
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-400 shrink-0 stroke-[2.2]" />{' '}
                  {platformSettings.platformAddress}
                </li>
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-indigo-400 shrink-0 stroke-[2.2]" />{' '}
                  {platformSettings.platformPhone}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400 shrink-0 stroke-[2.2]" />{' '}
                  {platformSettings.platformEmail}
                </li>
              </ul>

              <div className="pt-3 flex items-center gap-2.5">
                {platformSettings.platformSocials?.facebook && (
                  <a
                    href={platformSettings.platformSocials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-slate-300 hover:text-white transition-all shadow-sm"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {platformSettings.platformSocials?.twitter && (
                  <a
                    href={platformSettings.platformSocials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-slate-300 hover:text-white transition-all shadow-sm"
                    title="Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {platformSettings.platformSocials?.linkedin && (
                  <a
                    href={platformSettings.platformSocials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-slate-300 hover:text-white transition-all shadow-sm"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {platformSettings.platformSocials?.youtube && (
                  <a
                    href={platformSettings.platformSocials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-slate-300 hover:text-white transition-all shadow-sm"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {platformSettings.platformSocials?.instagram && (
                  <a
                    href={platformSettings.platformSocials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-slate-300 hover:text-white transition-all shadow-sm"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              &copy; {new Date().getFullYear()} OmniManage ERP. Built with
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
              by
              <Link
                to="/developer"
                className="font-extrabold text-white hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
              >
                Salah Uddin Kader
                <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400" />
              </Link>
            </div>
            <div className="text-slate-500 text-[11px]">
              Enterprise Mobile Shop Multi-Tenant Cloud ERP
            </div>
          </div>
        </div>
      </footer>

      {/* ─── SCROLL TO TOP ───────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-5 right-5 z-50 p-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
