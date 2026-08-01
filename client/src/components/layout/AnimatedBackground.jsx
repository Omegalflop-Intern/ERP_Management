import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedBackground() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const currentMouseRef = useRef({ x: 0, y: 0 });
  const reqIdRef = useRef(null);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    if (mediaQuery.matches) return;

    // Mouse movement handler with smooth 60fps lerp interpolation
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      // Normalize mouse coordinates from -1 to 1
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;
      targetMouseRef.current = { x: normX, y: normY };
    };

    // Passive scroll position tracker for subtle parallax
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

    // Smooth animation frame loop for mouse interpolation (max 15-25px shift)
    const animate = () => {
      const lerpFactor = 0.05; // silky smooth easing
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
      {/* Primary & Secondary Layer Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#F8FAFC] dark:from-[#0b0f17] dark:via-[#111827] dark:to-[#0b0f17] animate-bg-breathe" />

      {/* Extremely Subtle SVG Noise Texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.015] pointer-events-none">
        <filter id="erpNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#erpNoiseFilter)" />
      </svg>

      {/* Corner Dot Grid Patterns (Only near 4 corners, opacity 3%) */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_75%)]" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_75%)]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_bottom_left,black_20%,transparent_75%)]" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_bottom_right,black_20%,transparent_75%)]" />

      {/* 4 Large Blurred Ambient Radial Lights */}
      {!reducedMotion && (
        <>
          {/* Top Left: Blue Glow */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 20}px, ${mouseOffset.y * 20 - scrollY * 0.05}px, 0)`,
            }}
            className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-blue-500/16 dark:bg-blue-600/25 rounded-full blur-[110px] animate-ambient-glow-1 will-change-transform"
          />

          {/* Top Right: Light Cyan Glow */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -18}px, ${mouseOffset.y * -16 - scrollY * 0.06}px, 0)`,
            }}
            className="absolute -top-40 -right-40 w-[650px] h-[650px] bg-sky-400/18 dark:bg-[#0EA5E9]/25 rounded-full blur-[110px] animate-ambient-glow-2 will-change-transform"
          />

          {/* Bottom Left: Soft Indigo Glow */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * -20 - scrollY * 0.05}px, 0)`,
            }}
            className="absolute -bottom-40 -left-40 w-[650px] h-[650px] bg-indigo-400/16 dark:bg-indigo-600/22 rounded-full blur-[120px] animate-ambient-glow-3 will-change-transform"
          />

          {/* Bottom Right: Very Light Purple / Blue Glow */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -22}px, ${mouseOffset.y * 18 - scrollY * 0.06}px, 0)`,
            }}
            className="absolute -bottom-40 -right-40 w-[650px] h-[650px] bg-purple-400/16 dark:bg-blue-800/22 rounded-full blur-[120px] animate-ambient-glow-4 will-change-transform"
          />

          {/* Floating Organic Gradient Blobs */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x * 12}px, ${mouseOffset.y * 12 - scrollY * 0.04}px, 0)`,
            }}
            className="absolute top-1/3 left-1/4 w-[480px] h-[480px] bg-gradient-to-r from-blue-400/14 to-indigo-400/14 dark:from-blue-600/18 dark:to-indigo-600/18 rounded-full blur-[90px] animate-blob-float-1 will-change-transform"
          />

          <div
            style={{
              transform: `translate3d(${mouseOffset.x * -14}px, ${mouseOffset.y * -12 - scrollY * 0.04}px, 0)`,
            }}
            className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-sky-400/14 to-cyan-400/14 dark:from-sky-600/18 dark:to-cyan-600/18 rounded-full blur-[95px] animate-blob-float-2 will-change-transform"
          />
        </>
      )}
    </div>
  );
}
