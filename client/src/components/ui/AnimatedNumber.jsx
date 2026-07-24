import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    : Number(value) || 0;

  const isString = typeof value === 'string' && value.includes('৳');

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = fromRef.current + (numericValue - fromRef.current) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [numericValue, duration]);

  if (isString) {
    const formatted = Math.round(display).toLocaleString();
    return <span>{prefix}{formatted}{suffix}</span>;
  }

  return <span>{prefix}{Math.round(display).toLocaleString()}{suffix}</span>;
}
