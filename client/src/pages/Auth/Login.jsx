import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PasswordInput from '../../components/ui/PasswordInput';
import ThemeToggle from '../../components/ui/ThemeToggle';

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: 0.15 + Math.random() * 0.35,
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
        ctx.fillStyle = `rgba(220,38,38,${p.o})`;
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
            ctx.strokeStyle = `rgba(220,38,38,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 24,
  left: Math.random() * 100,
  delay: Math.random() * 10,
  duration: 4 + Math.random() * 8,
}));

const FOAM_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  width: 80 + Math.random() * 180,
  left: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 6 + Math.random() * 6,
  bottom: 5 + Math.random() * 25,
}));

function getWaveColors(mode, isDark) {
  const palettes = {
    flat: {
      deep: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(30,58,138,0.15)',
      mid: isDark ? 'rgba(30,64,175,0.35)' : 'rgba(59,130,246,0.1)',
      light: isDark ? 'rgba(96,165,250,0.2)' : 'rgba(147,197,253,0.08)',
      foam: isDark ? 'rgba(191,219,254,0.1)' : 'rgba(219,234,254,0.12)',
      accent: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(59,130,246,0.06)',
      glow: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(96,165,250,0.04)',
      bg: isDark
        ? 'linear-gradient(-45deg, #0b0f19, #0f172a, #1e293b, #0b0f19)'
        : 'linear-gradient(-45deg, #eff6ff, #dbeafe, #bfdbfe, #eff6ff)',
    },
    neumorphism: {
      deep: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(120,113,108,0.12)',
      mid: isDark ? 'rgba(68,76,89,0.35)' : 'rgba(168,162,158,0.1)',
      light: isDark ? 'rgba(120,113,108,0.2)' : 'rgba(214,211,209,0.08)',
      foam: isDark ? 'rgba(168,162,158,0.1)' : 'rgba(231,229,228,0.12)',
      accent: isDark ? 'rgba(87,83,78,0.15)' : 'rgba(168,162,158,0.06)',
      glow: isDark ? 'rgba(120,113,108,0.08)' : 'rgba(214,211,209,0.04)',
      bg: isDark
        ? 'linear-gradient(-45deg, #1a1c23, #27292e, #1e2025, #1a1c23)'
        : 'linear-gradient(-45deg, #f5f5f4, #e7e5e4, #d6d3d1, #f5f5f4)',
    },
    glassmorphism: {
      deep: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(99,102,241,0.12)',
      mid: isDark ? 'rgba(49,46,129,0.35)' : 'rgba(139,92,246,0.08)',
      light: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(196,181,253,0.06)',
      foam: isDark ? 'rgba(165,180,252,0.1)' : 'rgba(221,214,254,0.1)',
      accent: isDark ? 'rgba(67,56,202,0.15)' : 'rgba(139,92,246,0.05)',
      glow: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(165,180,252,0.04)',
      bg: isDark
        ? 'linear-gradient(-45deg, #0b0f19, #1e1b4b, #312e81, #0b0f19)'
        : 'linear-gradient(-45deg, #eef2ff, #e0e7ff, #c7d2fe, #eef2ff)',
    },
    liquidglass: {
      deep: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(6,182,212,0.1)',
      mid: isDark ? 'rgba(22,78,99,0.35)' : 'rgba(34,211,238,0.07)',
      light: isDark ? 'rgba(6,182,212,0.2)' : 'rgba(103,232,249,0.05)',
      foam: isDark ? 'rgba(103,232,249,0.1)' : 'rgba(165,243,252,0.08)',
      accent: isDark ? 'rgba(21,94,117,0.15)' : 'rgba(34,211,238,0.04)',
      glow: isDark ? 'rgba(6,182,212,0.08)' : 'rgba(103,232,249,0.03)',
      bg: isDark
        ? 'linear-gradient(-45deg, #0b0f19, #083344, #164e63, #0b0f19)'
        : 'linear-gradient(-45deg, #ecfeff, #cffafe, #a5f3fc, #ecfeff)',
    },
    neobrutalism: {
      deep: isDark ? 'rgba(120,53,15,0.4)' : 'rgba(234,179,8,0.12)',
      mid: isDark ? 'rgba(180,83,9,0.3)' : 'rgba(245,158,11,0.08)',
      light: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(253,230,138,0.06)',
      foam: isDark ? 'rgba(253,230,138,0.08)' : 'rgba(254,249,195,0.1)',
      accent: isDark ? 'rgba(161,98,7,0.15)' : 'rgba(245,158,11,0.05)',
      glow: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(253,230,138,0.03)',
      bg: isDark
        ? 'linear-gradient(-45deg, #1c1917, #292524, #44403c, #1c1917)'
        : 'linear-gradient(-45deg, #fffef9, #fef9c3, #fef3c7, #fffef9)',
    },
    aurora: {
      deep: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(99,102,241,0.12)',
      mid: isDark ? 'rgba(49,46,129,0.35)' : 'rgba(139,92,246,0.08)',
      light: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(196,181,253,0.06)',
      foam: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(221,214,254,0.1)',
      accent: isDark ? 'rgba(67,56,202,0.15)' : 'rgba(139,92,246,0.05)',
      glow: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(165,180,252,0.04)',
      bg: isDark
        ? 'linear-gradient(-45deg, #0b0f19, #1e1b4b, #312e81, #0b0f19)'
        : 'linear-gradient(-45deg, #eef2ff, #faf5ff, #fdf2f8, #eef2ff)',
    },
    glassmorphismpro: {
      deep: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(99,102,241,0.12)',
      mid: isDark ? 'rgba(49,46,129,0.35)' : 'rgba(168,85,247,0.08)',
      light: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(196,181,253,0.06)',
      foam: isDark ? 'rgba(192,132,252,0.1)' : 'rgba(233,213,255,0.1)',
      accent: isDark ? 'rgba(67,56,202,0.15)' : 'rgba(168,85,247,0.05)',
      glow: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(196,181,253,0.04)',
      bg: isDark
        ? 'linear-gradient(-45deg, #0b0f19, #1e1b4b, #312e81, #0b0f19)'
        : 'linear-gradient(-45deg, #eef2ff, #faf5ff, #fdf2f8, #eef2ff)',
    },
  };
  return palettes[mode] || palettes.flat;
}

export default function Login() {
  const [loginField, setLoginField] = useState(() => localStorage.getItem('rememberedLogin') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedLogin'));
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, styled, mode } = useTheme();

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
      if (result?.requiresVerification) {
        navigate('/verify-email', { state: { email: result.email } });
        return;
      }
      navigate('/dashboard');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const wc = useMemo(() => getWaveColors(mode || 'flat', isDark), [mode, isDark]);

  const inputClass = styled
    ? 'neu-input w-full px-4 py-3 text-sm focus:outline-none transition-all'
    : 'w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-[#0b0f19]">
      <ParticleCanvas />

      {/* Animated gradient background */}
      <div className="absolute inset-0 login-bg z-0" style={{ background: wc.bg }} />

      {/* Floating orbs — mode-aware colors */}
      <div className="absolute w-[600px] h-[600px] -top-48 -left-48 rounded-full blur-[120px] animate-drift pointer-events-none"
        style={{ background: wc.glow }} />
      <div className="absolute w-[500px] h-[500px] -bottom-40 -right-40 rounded-full blur-[110px] animate-drift pointer-events-none"
        style={{ background: wc.accent, animationDelay: '4s' }} />
      <div className="absolute w-[350px] h-[350px] top-1/4 left-1/3 rounded-full blur-[90px] animate-float pointer-events-none"
        style={{ background: wc.mid, animationDelay: '2s' }} />
      <div className="absolute w-[250px] h-[250px] bottom-1/3 right-1/4 rounded-full blur-[70px] animate-float-delayed pointer-events-none"
        style={{ background: wc.light }} />

      {/* Bubbles rising */}
      {BUBBLES.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: '-20px',
            background: wc.foam,
            border: `1px solid ${wc.light}`,
            animation: `bubble-rise ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}

      {/* Foam drift particles */}
      {FOAM_PARTICLES.map((f) => (
        <div
          key={`foam-${f.id}`}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: f.width,
            height: 3,
            left: `${f.left}%`,
            bottom: `${f.bottom}%`,
            background: `linear-gradient(90deg, transparent, ${wc.foam}, transparent)`,
            animation: `foam-slide ${f.duration}s linear ${f.delay}s infinite`,
            opacity: 0.5,
          }}
        />
      ))}

      {/* 7-layer sea waves at bottom */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none z-[1]" style={{ height: '35%' }}>
        {/* Layer 1 — deepest, slowest */}
        <svg className="absolute bottom-0 w-[200%] h-full" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 18s linear infinite' }}>
          <path fill={wc.deep}
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        {/* Layer 2 */}
        <svg className="absolute bottom-0 w-[200%] h-full" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 14s linear -3s infinite' }}>
          <path fill={wc.mid}
            d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        {/* Layer 3 */}
        <svg className="absolute bottom-0 w-[200%] h-full" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 10s linear -1s infinite' }}>
          <path fill={wc.light}
            d="M0,288L48,277.3C96,267,192,245,288,234.7C384,224,480,224,576,234.7C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        {/* Layer 4 — foam line */}
        <svg className="absolute bottom-0 w-[200%] h-[70%]" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 8s linear -2s infinite' }}>
          <path fill={wc.foam}
            d="M0,288L60,282.7C120,277,240,267,360,261.3C480,256,600,256,720,266.7C840,277,960,299,1080,293.3C1200,288,1320,256,1380,240L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>
        {/* Layer 5 — accent shimmer */}
        <svg className="absolute bottom-0 w-[200%] h-[55%]" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 12s linear -4s infinite', opacity: 0.7 }}>
          <path fill={wc.accent}
            d="M0,298L48,293.3C96,288,192,277,288,272C384,267,480,267,576,277.3C672,288,768,309,864,304C960,299,1056,267,1152,256C1248,245,1344,256,1392,261.3L1440,267L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        {/* Layer 6 — near-surface glow */}
        <svg className="absolute bottom-0 w-[200%] h-[40%]" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 16s linear -6s infinite', opacity: 0.5 }}>
          <path fill={wc.glow}
            d="M0,304L60,298.7C120,293,240,283,360,277.3C480,272,600,272,720,282.7C840,293,960,315,1080,309.3C1200,304,1320,272,1380,256L1440,240L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>
        {/* Layer 7 — surface sparkle */}
        <svg className="absolute bottom-0 w-[200%] h-[25%]" viewBox="0 0 1440 320" preserveAspectRatio="none"
          style={{ animation: 'wave 9s linear -1s infinite', opacity: 0.35 }}>
          <path fill={wc.foam}
            d="M0,312L48,309.3C96,307,192,301,288,296C384,291,480,288,576,293.3C672,299,768,315,864,314.7C960,315,1056,299,1152,293.3C1248,288,1344,293,1392,296L1440,299L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Brand icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${styled ? 'neu-icon !bg-red-600/10 !border-none' : 'bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10'}`}>
            <Smartphone className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight text-center">
          Brothers Mobile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
          ERP System — Sign in to continue
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl p-8 ${styled ? 'neu-card' : 'bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-white/40 dark:border-white/[0.08] shadow-2xl shadow-black/5 dark:shadow-black/30'}`}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Username / Email / Phone
              </label>
              <input
                type="text"
                required
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                placeholder="Enter your credentials"
                className={inputClass}
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-300 ${
                  loading ? 'opacity-80 cursor-wait' : 'hover:shadow-lg hover:shadow-red-700/30 hover:-translate-y-0.5 active:translate-y-0'
                } ${styled ? 'neu-btn !bg-red-700 !text-white' : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700'}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>


        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} Brothers Mobile. All rights reserved.
        </p>
      </div>
    </div>
  );
}
