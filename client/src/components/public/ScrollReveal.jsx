import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal component that animates children when scrolled into view using IntersectionObserver.
 * Options:
 * - animation: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'fade'
 * - delay: number (ms)
 * - duration: number (ms)
 * - threshold: number (0-1)
 * - className: string
 */
export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.15,
  className = '',
  once = true,
  as: Component = 'div',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && domRef.current) {
            observer.unobserve(domRef.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [threshold, once]);

  const getAnimationStyles = () => {
    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return 'opacity-0 translate-y-8';
        case 'fade-down':
          return 'opacity-0 -translate-y-8';
        case 'fade-left':
          return 'opacity-0 translate-x-8';
        case 'fade-right':
          return 'opacity-0 -translate-x-8';
        case 'zoom-in':
          return 'opacity-0 scale-95';
        case 'fade':
        default:
          return 'opacity-0';
      }
    }
    return 'opacity-100 translate-y-0 translate-x-0 scale-100';
  };

  return (
    <Component
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-out transform ${getAnimationStyles()} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
