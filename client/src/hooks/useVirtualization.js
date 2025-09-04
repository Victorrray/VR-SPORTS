import { useState, useEffect, useMemo, useCallback } from 'react';

// Virtual scrolling hook for large lists
export function useVirtualization({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        ...item,
        index: visibleRange.startIndex + index
      }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(options = {}) {
  const [entries, setEntries] = useState([]);
  const [observer, setObserver] = useState(null);

  useEffect(() => {
    const obs = new IntersectionObserver((observedEntries) => {
      setEntries(observedEntries);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    setObserver(obs);

    return () => obs.disconnect();
  }, []);

  const observe = useCallback((element) => {
    if (observer && element) {
      observer.observe(element);
    }
  }, [observer]);

  const unobserve = useCallback((element) => {
    if (observer && element) {
      observer.unobserve(element);
    }
  }, [observer]);

  return { entries, observe, unobserve };
}
