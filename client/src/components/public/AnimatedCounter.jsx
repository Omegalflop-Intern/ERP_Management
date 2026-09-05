import React, { useEffect, useRef, useState } from 'react';

/**
 * AnimatedCounter counts up smoothly when scrolled into view.
 * Props:
 * - end: number (e.g. 500, 1.2, 99.98, 250)
 * - duration: number (ms, default 2000)
 * - prefix: string (e.g. "৳ ")
 * - suffix: string (e.g. "+", "M+", "%")
 * - decimals: number (optional override)
 * - className: string
 */
export default function AnimatedCounter({
  end = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals,
  className = '',
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const domRef = useRef(null);

  const numEnd = typeof end === 'number' ? end : parseFloat(String(end).replace(/[^0-9.-]+/g, '')) || 0;
  const isFloat = String(end).includes('.') || (decimals !== undefined && decimals > 0);
  const decimalPlaces = decimals !== undefined ? decimals : isFloat ? (String(end).split('.')[1]?.length || 1) : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          if (domRef.current) {
            observer.unobserve(domRef.current);
          }
        }
      },
      { threshold: 0.15 }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Smooth cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = easeProgress * numEnd;

      setCount(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(numEnd);
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [hasStarted, numEnd, duration]);

  const formattedValue = isFloat
    ? count.toFixed(decimalPlaces)
    : Math.floor(count).toLocaleString();

  return (
    <span ref={domRef} className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
