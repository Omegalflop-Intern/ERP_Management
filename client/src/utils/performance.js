import React, { memo, useMemo, useCallback, useEffect, useRef, useState } from 'react';

// Memoized component wrapper
export const MemoizedComponent = memo(({ children, ...props }) => {
  return React.cloneElement(children, props);
});

// Memoized list item
export const MemoizedListItem = memo(({ item, renderItem, onItemClick }) => {
  return (
    <div
      onClick={() => onItemClick?.(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onItemClick?.(item);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {renderItem(item)}
    </div>
  );
});

// Virtualized list for large datasets
export const VirtualizedList = ({ items, itemHeight = 50, containerHeight = 400, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index,
    }));
  }, [items, scrollTop, itemHeight, containerHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="scrollbar-thin"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div
            key={item.id || item.virtualIndex}
            style={{
              position: 'absolute',
              top: item.virtualIndex * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Debounced search input
export const DebouncedInput = ({ value, onChange, delay = 300, ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChangeRef.current(newValue);
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return <input value={localValue} onChange={handleChange} {...props} />;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin]);

  return { ref, isIntersecting, hasIntersected };
};

// Lazy load component with intersection observer
export const LazyLoadComponent = ({ children, fallback = null }) => {
  const { ref, hasIntersected } = useIntersectionObserver();

  return <div ref={ref}>{hasIntersected ? children : fallback}</div>;
};

// Optimized image component
export const OptimizedImage = memo(({ src, alt, className = '', loading = 'lazy' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && <div className="absolute inset-0 bg-muted animate-pulse" />}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
});

// Memoized chart wrapper
export const MemoizedChart = memo(({ children, data }) => {
  return children;
});

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;

    // Performance monitoring - use componentName and timeSinceLastRender in dev tools
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(
        `[${componentName}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`
      );
    }

    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
  };
};

// Optimize re-renders with shallow comparison
export const useShallowMemo = (factory, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
};

// Optimized event handler
export const useOptimizedCallback = (callback, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
};

export default {
  MemoizedComponent,
  MemoizedListItem,
  VirtualizedList,
  DebouncedInput,
  useIntersectionObserver,
  LazyLoadComponent,
  OptimizedImage,
  MemoizedChart,
  usePerformanceMonitor,
  useShallowMemo,
  useOptimizedCallback,
};
