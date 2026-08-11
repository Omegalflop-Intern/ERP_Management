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

    const particleColor = isDark ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.35)';
    const lineColor = isDark ? '37, 99, 235' : '37, 99, 235';

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 2.5,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
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
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lineColor}, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
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
function MultiImageSlideshow() {
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
            index === currentIndex ? 'opacity-35 dark:opacity-45 scale-105' : 'opacity-0 scale-100'
          } transform transition-transform duration-7000`}
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/40 dark:from-black/50 dark:to-black/70" />
    </div>
  );
}

// --- 7-Layer Flowing Sea Waves Component ---
function FlowingSeaWaves({ isDark }) {
  const deepColor = isDark ? 'rgba(15,23,42,0.65)' : 'rgba(30,58,138,0.18)';
  const midColor = isDark ? 'rgba(30,64,175,0.45)' : 'rgba(37,99,235,0.14)';
  const lightColor = isDark ? 'rgba(96,165,250,0.25)' : 'rgba(96,165,250,0.1)';
  const foamColor = isDark ? 'rgba(191,219,254,0.12)' : 'rgba(219,234,254,0.15)';

  return (
    <div className="absolute bottom-0 left-0 w-full pointer-events-none z-10 h-[38%] overflow-hidden">
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
      <svg
        className="absolute bottom-0 w-[200%] h-[70%]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ animation: 'wave 8s linear -2s infinite' }}
      >
        <path
          fill={foamColor}
          d="M0,288L60,282.7C120,277,240,267,360,261.3C480,256,600,256,720,266.7C840,277,960,299,1080,293.3C1200,288,1320,256,1380,240L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
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
  const [bgMode, setBgMode] = useState('hybrid'); // 'waves' | 'particles' | 'slideshow' | 'hybrid'

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
    (subdomain ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Store` : 'Omegaflop Business Suite');

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
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/80 shadow-2xl shadow-blue-600/10">
            <Smartphone className="w-8 h-8 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight text-center mb-1 drop-shadow-md">
          {displayShopName}
        </h1>
        <p className="text-sm font-semibold text-slate-200 dark:text-slate-300 text-center mb-8 drop-shadow">
          Enterprise ERP System — Sign in to continue
        </p>

        {/* High-Contrast Glass Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/90 dark:border-slate-800/80 shadow-2xl shadow-black/30 rounded-3xl p-8 md:p-10 relative overflow-hidden"
        >
          <div className="space-y-5">
            {/* Login Field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Username / Email / Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
                <input
                  type="text"
                  required
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Enter username, email or phone"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/20 shadow-sm outline-none"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-[#2563EB] dark:text-blue-400 hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/20 shadow-sm outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
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
                className="w-4 h-4 rounded cursor-pointer accent-[#2563EB]"
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
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-lg shadow-[#2563EB]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
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
          &copy; {new Date().getFullYear()} Omegaflop Business Suite. All rights reserved.
        </p>
      </div>
    </div>
  );
}
