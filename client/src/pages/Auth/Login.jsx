import {
  ArrowRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Lock,
  RefreshCw,
  Smartphone,
  Sparkles,
  User,
  Waves,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';
import { detectSubdomain } from '../../utils/subdomain';

// --- Particle Constellation Canvas Component ---
function ParticleCanvas({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const particleColor = isDark ? 'rgba(59, 130, 246, 0.65)' : 'rgba(37, 99, 235, 0.45)';
    const lineColor = isDark ? '59, 130, 246' : '37, 99, 235';

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 2,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lineColor}, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}

// --- Multi-Image Slideshow Component ---
function MultiImageSlideshow({ opacity = 'opacity-35 dark:opacity-45' }) {
  const images = ['/auth-bg/waves.png', '/auth-bg/tech.png'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? `${opacity} scale-105` : 'opacity-0 scale-100'
          } transform transition-transform duration-7000`}
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/60 dark:from-black/60 dark:via-black/30 dark:to-black/80" />
    </div>
  );
}

// --- Flowing Sea Waves Component ---
function FlowingSeaWaves({ isDark, isHybrid = false }) {
  const deepColor = isDark ? 'rgba(30, 58, 138, 0.35)' : 'rgba(37, 99, 235, 0.2)';
  const midColor = isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(96, 165, 250, 0.15)';
  const lightColor = isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(191, 219, 254, 0.12)';
  const heightClass = isHybrid ? 'h-[24%]' : 'h-[36%]';

  return (
    <div
      className={`absolute bottom-0 left-0 w-full pointer-events-none z-10 ${heightClass} overflow-hidden transition-all duration-500`}
    >
      <svg
        className="absolute bottom-0 w-[200%] h-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ animation: 'wave 18s linear infinite' }}
      >
        <path
          fill={deepColor}
          d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <svg
        className="absolute bottom-0 w-[200%] h-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ animation: 'wave 14s linear -3s infinite' }}
      >
        <path
          fill={midColor}
          d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <svg
        className="absolute bottom-0 w-[200%] h-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ animation: 'wave 10s linear -1s infinite' }}
      >
        <path
          fill={lightColor}
          d="M0,288L48,277.3C96,267,192,245,288,234.7C384,224,480,224,576,234.7C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  );
}

export default function Login() {
  useDocumentTitle('Login');
  const [loginField, setLoginField] = useState(() => localStorage.getItem('rememberedLogin') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedLogin'));
  const [loading, setLoading] = useState(false);
  const [bgMode, setBgMode] = useState('particles'); // Default clean mode ('particles' | 'waves' | 'slideshow' | 'hybrid')

  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const subdomain = detectSubdomain();

  const { data: publicShop } = useQuery({
    queryKey: ['public-tenant-login', subdomain],
    queryFn: async () => {
      const res = await api.get(`/tenants/public/by-subdomain/${subdomain}`);
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!subdomain,
  });

  const displayShopName =
    publicShop?.shopName ||
    (subdomain ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Store` : 'OmniManage');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(loginField, password);
      if (rememberMe) {
        localStorage.setItem('rememberedLogin', loginField);
      } else {
        localStorage.removeItem('rememberedLogin');
      }
      if (result?.requiresOtp) {
        navigate('/verify-email', { state: { email: result.email } });
        return;
      }
      if (!result?.tenantId && result?.roleName === 'ADMIN') {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 dark:bg-[#050810] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Dynamic Background Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 dark:from-[#050810] dark:via-[#0b0f19] dark:to-[#050810] z-0" />

      {/* 1. Multi-Image Slideshow Layer */}
      {(bgMode === 'slideshow' || bgMode === 'hybrid') && <MultiImageSlideshow />}

      {/* 2. Live Particle Constellations Layer */}
      {(bgMode === 'particles' || bgMode === 'hybrid') && <ParticleCanvas isDark={isDark} />}

      {/* 3. Flowing 7-Layer Sea Waves Layer */}
      {(bgMode === 'waves' || bgMode === 'hybrid') && <FlowingSeaWaves isDark={isDark} />}

      {/* Glowing Ambient Mesh Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-blue-600/20 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-600/20 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />

      {/* Top Bar Controls */}
      <div className="absolute top-5 right-5 z-50 flex items-center gap-3">
        {/* Background Animation Switcher Toolbar */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-white/10 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700/60 shadow-lg text-xs font-semibold text-white">
          <button
            onClick={() => setBgMode('waves')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              bgMode === 'waves'
                ? 'bg-[#2563EB] text-white shadow-md'
                : 'hover:bg-white/15 text-slate-200'
            }`}
            title="Flowing Sea Waves Animation"
          >
            <Waves className="w-3.5 h-3.5" /> Waves
          </button>
          <button
            onClick={() => setBgMode('particles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              bgMode === 'particles'
                ? 'bg-[#2563EB] text-white shadow-md'
                : 'hover:bg-white/15 text-slate-200'
            }`}
            title="Interactive Constellation Particles"
          >
            <Sparkles className="w-3.5 h-3.5" /> Particles
          </button>
          <button
            onClick={() => setBgMode('slideshow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              bgMode === 'slideshow'
                ? 'bg-[#2563EB] text-white shadow-md'
                : 'hover:bg-white/15 text-slate-200'
            }`}
            title="Multi-Image Swapping Background"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Swapping
          </button>
          <button
            onClick={() => setBgMode('hybrid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              bgMode === 'hybrid'
                ? 'bg-[#2563EB] text-white shadow-md'
                : 'hover:bg-white/15 text-slate-200'
            }`}
            title="Hybrid All-in-One Experience"
          >
            <Layers className="w-3.5 h-3.5" /> Hybrid
          </button>
        </div>

        <ThemeToggle />
      </div>

      {/* Main Login Form Container */}
      <div className="relative z-20 w-full max-w-md mx-4 py-8">
        {/* Brand Header */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/30 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/20 shadow-2xl shadow-blue-500/20">
            <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight text-center mb-1 drop-shadow-lg">
          {displayShopName}
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200/90 dark:text-blue-300/80 text-center mb-8 drop-shadow">
          Enterprise ERP Suite — Apple macOS Liquid Glass
        </p>

        {/* Apple macOS / iOS Liquid Glass Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/60 dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] rounded-[32px] p-8 md:p-10 relative overflow-hidden"
        >
          {/* Internal Liquid Shine Highlight */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/30 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Login Field */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Username / Email / Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 stroke-[2.5] z-10 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Enter username, email or phone"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 bg-white/60 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25 shadow-xs outline-none"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 stroke-[2.5] z-10 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 bg-white/60 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25 shadow-xs outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 z-10"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md cursor-pointer accent-blue-600"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] shadow-xl shadow-blue-600/30 border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-xs font-bold text-slate-300 dark:text-slate-400 mt-6 drop-shadow">
          &copy; {new Date().getFullYear()} OmniManage. All rights reserved.
        </p>
      </div>
    </div>
  );
}
