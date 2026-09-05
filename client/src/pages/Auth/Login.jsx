import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Store,
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
import api, { getAssetUrl } from '../../lib/api';
import { detectSubdomain, getMainPortalUrl } from '../../utils/subdomain';

// --- 1. Japanese Samurai Sakura & Ink Embers Canvas ---
function SamuraiCanvas({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Sakura Petals
    const petals = Array.from({ length: 42 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h - h * 0.2,
      size: 7 + Math.random() * 8,
      speedX: 0.8 + Math.random() * 1.5,
      speedY: 1.2 + Math.random() * 1.8,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.04,
      flip: Math.random() * Math.PI,
      flipSpeed: 0.02 + Math.random() * 0.03,
    }));

    // Fiery Floating Embers
    const embers = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.2,
      speedY: -(0.4 + Math.random() * 0.8),
      speedX: (Math.random() - 0.5) * 0.5,
      alpha: 0.2 + Math.random() * 0.6,
      pulse: Math.random() * 0.05,
    }));

    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.scale(Math.cos(p.flip), 1);

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.7, p.size * 0.8, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.8, -p.size * 0.7, 0, -p.size);

      const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
      if (isDark) {
        grad.addColorStop(0, 'rgba(251, 113, 133, 0.85)'); // rose-400
        grad.addColorStop(0.6, 'rgba(244, 63, 94, 0.75)'); // rose-500
        grad.addColorStop(1, 'rgba(225, 29, 72, 0.6)');
      } else {
        grad.addColorStop(0, 'rgba(253, 164, 175, 0.9)');
        grad.addColorStop(0.6, 'rgba(251, 113, 133, 0.8)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.65)');
      }

      ctx.fillStyle = grad;
      ctx.shadowColor = isDark ? 'rgba(225, 29, 72, 0.4)' : 'rgba(251, 113, 133, 0.3)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Subtle atmospheric samurai sun / moon glow
      const sunGrad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.35,
        10,
        w * 0.5,
        h * 0.35,
        Math.min(w, h) * 0.45
      );
      if (isDark) {
        sunGrad.addColorStop(0, 'rgba(225, 29, 72, 0.12)');
        sunGrad.addColorStop(0.5, 'rgba(180, 83, 9, 0.05)');
        sunGrad.addColorStop(1, 'transparent');
      } else {
        sunGrad.addColorStop(0, 'rgba(254, 205, 211, 0.3)');
        sunGrad.addColorStop(0.6, 'rgba(253, 230, 138, 0.1)');
        sunGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw embers
      for (const eb of embers) {
        eb.y += eb.speedY;
        eb.x += eb.speedX + Math.sin(eb.y * 0.01) * 0.3;
        eb.alpha += Math.sin(Date.now() * eb.pulse) * 0.01;

        if (eb.y < -10) {
          eb.y = h + 10;
          eb.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(245, 158, 11, ${Math.max(0.1, Math.min(1, eb.alpha))})`
          : `rgba(217, 119, 6, ${Math.max(0.1, Math.min(0.8, eb.alpha))})`;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      // Draw sakura petals
      for (const p of petals) {
        p.x += p.speedX + Math.sin(p.y * 0.008) * 0.8;
        p.y += p.speedY;
        p.angle += p.angularSpeed;
        p.flip += p.flipSpeed;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;

        drawPetal(p);
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

// --- 2. Cyber Matrix Rain Canvas ---
function MatrixCanvas({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンOMNIMANAGE';
    const fontSize = 14;
    const columns = Math.floor(w / fontSize);
    const drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const draw = () => {
      ctx.fillStyle = isDark ? 'rgba(5, 8, 16, 0.15)' : 'rgba(241, 245, 249, 0.2)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (isDark) {
          ctx.fillStyle = '#4ade80'; // Bright green head
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#059669';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 4;
        }
        ctx.fillText(char, x, y);

        if (y > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
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

// --- 3. Cosmic Nebula Galaxy Canvas ---
function GalaxyCanvas({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 90 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 40 + Math.random() * Math.min(w, h) * 0.48,
      speed: 0.002 + Math.random() * 0.005,
      r: 0.8 + Math.random() * 2,
      color: ['#60a5fa', '#a78bfa', '#f472b6', '#38bdf8'][Math.floor(Math.random() * 4)],
    }));

    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Galaxy core nebula
      const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.4);
      if (isDark) {
        coreGrad.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
        coreGrad.addColorStop(0.4, 'rgba(59, 130, 246, 0.12)');
        coreGrad.addColorStop(1, 'transparent');
      } else {
        coreGrad.addColorStop(0, 'rgba(192, 132, 252, 0.25)');
        coreGrad.addColorStop(0.5, 'rgba(147, 197, 253, 0.15)');
        coreGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, w, h);

      rotation += 0.001;

      for (const s of stars) {
        s.angle += s.speed;
        const x = cx + Math.cos(s.angle + rotation) * s.dist;
        const y = cy + Math.sin(s.angle + rotation) * s.dist * 0.6; // elliptical

        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.fill();
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

// --- 4. Aurora Borealis Glow Component ---
function AuroraCanvas({ isDark }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className={`absolute -top-[30%] -left-[20%] w-[140%] h-[90%] rounded-[100%] blur-[100px] transition-all duration-1000 ${
          isDark
            ? 'bg-gradient-to-r from-emerald-500/20 via-teal-400/25 to-indigo-600/30'
            : 'bg-gradient-to-r from-emerald-400/25 via-cyan-300/30 to-blue-400/25'
        } animate-pulse`}
      />
      <div
        className={`absolute top-[20%] -right-[20%] w-[120%] h-[70%] rounded-[100%] blur-[120px] transition-all duration-1000 ${
          isDark
            ? 'bg-gradient-to-l from-violet-600/25 via-cyan-500/20 to-teal-400/15'
            : 'bg-gradient-to-l from-purple-400/20 via-sky-300/25 to-teal-300/20'
        } animate-pulse delay-700`}
      />
    </div>
  );
}

// --- 5. Retro Synthwave 80s Grid Canvas ---
function SynthwaveCanvas({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const horizon = h * 0.65;

      // Synthwave Neon Sun
      const sunR = Math.min(w, h) * 0.18;
      const sunGrad = ctx.createLinearGradient(0, horizon - sunR * 2, 0, horizon);
      sunGrad.addColorStop(0, '#facc15');
      sunGrad.addColorStop(0.5, '#f43f5e');
      sunGrad.addColorStop(1, '#a855f7');

      ctx.beginPath();
      ctx.arc(w * 0.5, horizon, sunR, Math.PI, 0);
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 25;
      ctx.fill();

      // Horizon line
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Perspective Grid Lines
      offset = (offset + 0.8) % 30;
      const gridColor = isDark ? 'rgba(236, 72, 153, 0.4)' : 'rgba(219, 39, 119, 0.3)';

      // Vertical rays from horizon
      for (let x = -w; x < w * 2; x += 55) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, horizon);
        ctx.lineTo(x, h);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Horizontal moving lines
      for (let y = horizon; y < h; y += (y - horizon) * 0.25 + 6) {
        const adjustedY = y + offset;
        if (adjustedY <= h) {
          ctx.beginPath();
          ctx.moveTo(0, adjustedY);
          ctx.lineTo(w, adjustedY);
          ctx.strokeStyle = gridColor;
          ctx.lineWidth = 1;
          ctx.stroke();
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

// --- 6. Liquid Lava Glass Blobs Canvas ---
function LiquidLavaCanvas({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const blobs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 90 + Math.random() * 80,
      dx: (Math.random() - 0.5) * 1.2,
      dy: (Math.random() - 0.5) * 1.2,
      color: [
        'rgba(37, 99, 235, 0.25)',
        'rgba(147, 51, 234, 0.22)',
        'rgba(236, 72, 153, 0.2)',
        'rgba(6, 182, 212, 0.22)',
      ][i % 4],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const b of blobs) {
        b.x += b.dx;
        b.y += b.dy;

        if (b.x < -50 || b.x > w + 50) b.dx *= -1;
        if (b.y < -50 || b.y > h + 50) b.dy *= -1;

        const grad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.r);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
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

// --- 7. Particle Constellation Canvas Component ---
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

// --- 8. Multi-Image Slideshow Component ---
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-white/80 dark:from-black/60 dark:via-black/30 dark:to-black/80" />
    </div>
  );
}

// --- 9. Flowing Sea Waves Component ---
function FlowingSeaWaves({ isDark, isHybrid = false }) {
  const deepColor = isDark ? 'rgba(30, 58, 138, 0.35)' : 'rgba(37, 99, 235, 0.22)';
  const midColor = isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(96, 165, 250, 0.16)';
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
  const [bgMode, setBgMode] = useState('samurai');
  const [showAnimDropdown, setShowAnimDropdown] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const subdomain = detectSubdomain();

  const {
    data: publicShop,
    isLoading: isShopLoading,
    isError: isShopError,
  } = useQuery({
    queryKey: ['public-tenant-login', subdomain],
    queryFn: async () => {
      const res = await api.get(`/tenants/public/by-subdomain/${subdomain}`);
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!subdomain,
    retry: false,
  });

  // Sync background animation from public shop settings if configured
  useEffect(() => {
    if (publicShop?.loginAnimation) {
      setBgMode(publicShop.loginAnimation);
    }
  }, [publicShop?.loginAnimation]);

  // Automatically clean up stale or expired session tokens if user lands on login page unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('branch-storage');
      localStorage.removeItem('omni_last_activity');
      sessionStorage.removeItem('activeTab');
    }
  }, [isAuthenticated]);

  const { data: publicPlatformSettings } = useQuery({
    queryKey: ['public-platform-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/public');
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const supportPhone =
    publicShop?.platformSupport?.phone ||
    publicPlatformSettings?.platformPhone ||
    '+880 1700-000000';

  const supportWhatsApp =
    publicShop?.platformSupport?.whatsapp ||
    publicPlatformSettings?.platformWhatsApp ||
    supportPhone;

  const supportEmail =
    publicShop?.platformSupport?.email ||
    publicPlatformSettings?.platformEmail ||
    'support@omnimanage.bd';

  const cleanPhoneForTel = supportPhone.replace(/[^0-9+]/g, '');
  const cleanPhoneForWhatsApp = supportWhatsApp.replace(/[^0-9]/g, '');

  const isInvalidSubdomain = Boolean(subdomain && !isShopLoading && (isShopError || !publicShop));
  const isSuspendedShop = Boolean(publicShop && publicShop.status === 'SUSPENDED');

  const displayShopName = publicShop?.shopName || 'OmniManage';

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

  // If loading public shop info on subdomain
  if (subdomain && isShopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#050810] text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Connecting to shop...</p>
        </div>
      </div>
    );
  }

  // 1. If visiting a Suspended / Deactivated Store
  if (isSuspendedShop) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-[#050810] text-slate-900 dark:text-slate-100 font-sans p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-slate-100 to-rose-500/5 dark:from-[#050810] dark:via-[#0e111a] dark:to-[#050810] z-0" />
        <div className="absolute top-5 right-5 z-50">
          <ThemeToggle />
        </div>

        <div className="relative z-20 w-full max-w-lg bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl rounded-[32px] p-8 md:p-10 text-center">
          {/* Shop Logo & Suspended Badge */}
          <div className="flex justify-center mb-4 relative">
            {publicShop?.logo ? (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 shadow-xl p-2 overflow-hidden">
                <img
                  src={getAssetUrl(publicShop.logo)}
                  alt={publicShop.shopName || 'Shop Logo'}
                  className="w-full h-full object-contain rounded-xl grayscale opacity-80"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xl text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-10 h-10 stroke-[2.2]" />
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Store Suspended / Inactive
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {publicShop.shopName}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            This store account has been temporarily deactivated or its ERP subscription has expired.
            Please reach out to our Customer Support team to reactivate access.
          </p>

          {/* Quick Support Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <a
              href={`tel:${cleanPhoneForTel}`}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Call Hotline
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                  {supportPhone}
                </div>
              </div>
            </a>

            <a
              href={`https://wa.me/${cleanPhoneForWhatsApp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  WhatsApp Support
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  Chat with Us
                </div>
              </div>
            </a>

            <a
              href={`mailto:${supportEmail}`}
              className="sm:col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Support Email
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {supportEmail}
                </div>
              </div>
            </a>
          </div>

          <div className="space-y-3">
            <a
              href={getMainPortalUrl('/contact')}
              className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              Open Support Ticket & Help Desk
            </a>

            <a
              href={getMainPortalUrl('/')}
              className="w-full py-3 px-4 rounded-2xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              Return to OmniManage Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. If visiting an unregistered / non-existent subdomain or unmapped custom domain
  if (isInvalidSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-[#050810] text-slate-900 dark:text-slate-100 font-sans p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-rose-50/20 to-indigo-50/20 dark:from-[#050810] dark:via-[#0b0f19] dark:to-[#050810] z-0" />
        <div className="absolute top-5 right-5 z-50">
          <ThemeToggle />
        </div>

        <div className="relative z-20 w-full max-w-lg bg-white/95 dark:bg-slate-900/85 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl rounded-[32px] p-8 md:p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 shadow-lg text-rose-600 dark:text-rose-400">
            <Store className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Store Not Found
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            The store with domain address{' '}
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              "{subdomain}"
            </span>{' '}
            is not registered or properly configured on the OmniManage network.
          </p>

          {/* Quick Support Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <a
              href={`tel:${cleanPhoneForTel}`}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Support Hotline
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                  {supportPhone}
                </div>
              </div>
            </a>

            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Support Email
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {supportEmail}
                </div>
              </div>
            </a>
          </div>

          <div className="space-y-3">
            <a
              href={getMainPortalUrl('/contact')}
              className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              Contact Support & Help Desk
            </a>

            <a
              href={getMainPortalUrl('/register-shop')}
              className="w-full py-3 px-4 rounded-2xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              Register a New Shop
            </a>

            <p className="pt-2 text-[11px] text-slate-400 dark:text-slate-500">
              <a
                href={getMainPortalUrl('/')}
                className="font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Return to OmniManage Home
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ANIMATIONS = [
    { id: 'samurai', name: 'Samurai Sakura', desc: '🌸 Falling Petals & Embers' },
    { id: 'waves', name: 'Sea Waves', desc: '🌊 Flowing 7-Layer Ocean' },
    { id: 'particles', name: 'Constellations', desc: '✨ Neural Network Nodes' },
    { id: 'matrix', name: 'Cyber Matrix', desc: '🟢 Digital Katakana Rain' },
    { id: 'galaxy', name: 'Cosmic Galaxy', desc: '🌌 Orbiting Nebula Starfield' },
    { id: 'aurora', name: 'Aurora Borealis', desc: '🌈 Shifting Northern Lights' },
    { id: 'synthwave', name: 'Retro Synthwave', desc: '🌆 80s Cyber Neon Grid' },
    { id: 'lava', name: 'Liquid Lava', desc: '🔮 Chromatic Metaballs' },
    { id: 'slideshow', name: 'Showcase', desc: '📱 Apple Gadget Gallery' },
    { id: 'hybrid', name: 'Hybrid Fusion', desc: '⚡ Sensory All-in-One' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-[#050810] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Dynamic Background Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-indigo-50/50 to-blue-50/40 dark:from-[#050810] dark:via-[#0b0f19] dark:to-[#050810] z-0" />

      {/* 10 Active Canvas Background Animation Layers */}
      {bgMode === 'samurai' && <SamuraiCanvas isDark={isDark} />}
      {bgMode === 'matrix' && <MatrixCanvas isDark={isDark} />}
      {bgMode === 'galaxy' && <GalaxyCanvas isDark={isDark} />}
      {bgMode === 'aurora' && <AuroraCanvas isDark={isDark} />}
      {bgMode === 'synthwave' && <SynthwaveCanvas isDark={isDark} />}
      {bgMode === 'lava' && <LiquidLavaCanvas isDark={isDark} />}
      {(bgMode === 'particles' || bgMode === 'hybrid') && <ParticleCanvas isDark={isDark} />}
      {(bgMode === 'waves' || bgMode === 'hybrid') && (
        <FlowingSeaWaves isDark={isDark} isHybrid={bgMode === 'hybrid'} />
      )}
      {(bgMode === 'slideshow' || bgMode === 'hybrid') && <MultiImageSlideshow />}

      {/* Glowing Ambient Mesh Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />

      {/* Top Bar Controls */}
      <div className="absolute top-5 right-5 z-50 flex items-center gap-3">
        {/* Background Animation Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAnimDropdown(!showAnimDropdown)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 shadow-lg text-xs font-bold text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
            <span className="capitalize">
              {ANIMATIONS.find((a) => a.id === bgMode)?.name || 'Animation'}
            </span>
          </button>

          {showAnimDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Visual Themes
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
                {ANIMATIONS.map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => {
                      setBgMode(anim.id);
                      setShowAnimDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex flex-col transition-all ${
                      bgMode === anim.id
                        ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="font-semibold">{anim.name}</span>
                    <span
                      className={`text-[10px] ${
                        bgMode === anim.id ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {anim.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />
      </div>

      {/* Main Login Form Container */}
      <div className="relative z-20 w-full max-w-md mx-4 py-8">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          {publicShop?.logo ? (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 shadow-2xl p-2 overflow-hidden">
              <img
                src={getAssetUrl(publicShop.logo)}
                alt={displayShopName}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center">
                <Store className="w-8 h-8 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-white/10 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 shadow-xl shadow-blue-500/10">
              {subdomain ? (
                <Store className="w-8 h-8 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
              ) : (
                <Smartphone className="w-8 h-8 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
              )}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-center mb-1">
          {displayShopName}
        </h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] dark:text-blue-400/90 text-center mb-8">
          {subdomain ? 'Point of Sale & Store Portal' : 'Enterprise ERP & Retail Solutions'}
        </p>

        {/* Apple macOS / iOS Liquid Glass Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/80 dark:border-white/15 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] rounded-[32px] p-8 md:p-10 relative overflow-hidden"
        >
          {/* Internal Liquid Shine Highlight */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Login Field */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                Username / Email / Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] dark:text-blue-400 stroke-[2.5] z-10 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Enter username, email or phone"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-xs outline-none"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
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
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] dark:text-blue-400 stroke-[2.5] z-10 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-xs outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 z-10"
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
                className="w-4 h-4 rounded-md cursor-pointer accent-[#2563EB]"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] shadow-xl shadow-blue-600/25 border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
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

        <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} OmniManage. All rights reserved.
        </p>
      </div>
    </div>
  );
}
