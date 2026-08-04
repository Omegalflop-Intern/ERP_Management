import { useEffect, useRef, useState } from 'react';

export default function AnimatedBackground() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const currentMouseRef = useRef({ x: 0, y: 0 });
  const reqIdRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    if (mediaQuery.matches) return;

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;
      targetMouseRef.current = { x: normX, y: normY };
    };

    const handleScroll = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        setScrollY(mainContent.scrollTop);
      } else {
        setScrollY(window.scrollY);
      }
    };

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      const lerpFactor = 0.05;
      currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * lerpFactor;
      currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * lerpFactor;

      setMouseOffset({
        x: currentMouseRef.current.x,
        y: currentMouseRef.current.y,
      });

      reqIdRef.current = requestAnimationFrame(animate);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      mediaQuery.removeEventListener('change', handleMediaChange);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* ── Base ── */}
      <div className="absolute inset-0">
        {/* Light: warm white */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFFCF9] via-[#FFF8F3] to-[#FFF5EE] dark:hidden" />
        {/* Dark: deep black */}
        <div className="absolute inset-0 hidden dark:block bg-[#08080c]" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          LIGHT MODE — 3 Warm Spotlights
          ══════════════════════════════════════════════════════════ */}
      {!reducedMotion && (
        <div className="absolute inset-0 dark:hidden pointer-events-none overflow-hidden">
          {/* Spotlight 1: top-right warm amber */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 22}px, ${mouseOffset.y * 20 - scrollY * 0.03}px, 0)`,
            }}
            className="absolute -top-28 -right-28 w-[550px] h-[550px] bg-[#FDBA74]/18 rounded-full blur-[110px] animate-ambient-glow-1 will-change-transform"
          />
          {/* Spotlight 2: bottom-left soft peach */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -20}px, ${mouseOffset.y * -18 - scrollY * 0.04}px, 0)`,
            }}
            className="absolute -bottom-28 -left-28 w-[500px] h-[500px] bg-[#FB923C]/12 rounded-full blur-[100px] animate-ambient-glow-2 will-change-transform"
          />
          {/* Spotlight 3: center subtle rose */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * 14 - scrollY * 0.02}px, 0)`,
            }}
            className="absolute top-[35%] -right-12 w-[420px] h-[420px] bg-[#FED7AA]/14 rounded-full blur-[90px] animate-ambient-glow-3 will-change-transform"
          />
        </div>
      )}

      {/* ── SVG Noise Texture ── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.012] pointer-events-none">
        <filter id="erpNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#erpNoiseFilter)" />
      </svg>

      {/* ══════════════════════════════════════════════════════════
          DARK MODE — 2 Gray-White Spotlights
          Top-left + Bottom-right, subtle white glow
          ══════════════════════════════════════════════════════════ */}
      {!reducedMotion && (
        <div className="absolute inset-0 hidden dark:block pointer-events-none overflow-hidden">
          {/* Top-left: soft white/slate glow */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 24}px, ${mouseOffset.y * 22 - scrollY * 0.04}px, 0)`,
            }}
            className="absolute -top-36 -left-36 w-[650px] h-[650px] bg-[#94a3b8]/8 rounded-full blur-[130px] animate-ambient-glow-1 will-change-transform"
          />
          {/* Bottom-right: subtle white glow */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -22}px, ${mouseOffset.y * -20 - scrollY * 0.05}px, 0)`,
            }}
            className="absolute -bottom-36 -right-36 w-[600px] h-[600px] bg-[#e2e8f0]/6 rounded-full blur-[120px] animate-ambient-glow-2 will-change-transform"
          />
        </div>
      )}
    </div>
  );
}
