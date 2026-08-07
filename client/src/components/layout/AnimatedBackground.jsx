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
        {/* Light: crisp slate-indigo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EEF2FF] dark:hidden" />
        {/* Dark: deep black */}
        <div className="absolute inset-0 hidden dark:block bg-[#08080c]" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          LIGHT MODE — 3 Modern Blue-Violet Ambient Spotlights
          ══════════════════════════════════════════════════════════ */}
      {!reducedMotion && (
        <div className="absolute inset-0 dark:hidden pointer-events-none overflow-hidden">
          {/* Spotlight 1: top-left soft indigo */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 22}px, ${mouseOffset.y * 20 - scrollY * 0.03}px, 0)`,
            }}
            className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-400/15 rounded-full blur-[130px] animate-ambient-glow-1 will-change-transform"
          />
          {/* Spotlight 2: bottom-right soft blue */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -20}px, ${mouseOffset.y * -18 - scrollY * 0.04}px, 0)`,
            }}
            className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-blue-400/12 rounded-full blur-[120px] animate-ambient-glow-2 will-change-transform"
          />
          {/* Spotlight 3: top-right subtle sky */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * 14 - scrollY * 0.02}px, 0)`,
            }}
            className="absolute top-[30%] -right-20 w-[480px] h-[480px] bg-sky-300/15 rounded-full blur-[100px] animate-ambient-glow-3 will-change-transform"
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
          DARK MODE — 2 Purple Spotlights
          Top-left + Bottom-right glowing purple
          ══════════════════════════════════════════════════════════ */}
      {!reducedMotion && (
        <div className="absolute inset-0 hidden dark:block pointer-events-none overflow-hidden">
          {/* Top-left: rich purple spotlight */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 24}px, ${mouseOffset.y * 22 - scrollY * 0.04}px, 0)`,
            }}
            className="absolute -top-44 -left-44 w-[700px] h-[700px] bg-[#8B5CF6]/25 rounded-full blur-[150px] animate-ambient-glow-1 will-change-transform"
          />
          {/* Bottom-right: deep violet/purple spotlight */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -22}px, ${mouseOffset.y * -20 - scrollY * 0.05}px, 0)`,
            }}
            className="absolute -bottom-44 -right-44 w-[700px] h-[700px] bg-[#7C3AED]/22 rounded-full blur-[140px] animate-ambient-glow-2 will-change-transform"
          />
        </div>
      )}
    </div>
  );
}
