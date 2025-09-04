import { useCallback, useRef } from 'react';

// Optimized callback hook that prevents unnecessary re-renders
export function useMemoizedCallback(callback, dependencies) {
  const callbackRef = useRef(callback);
  const depsRef = useRef(dependencies);

  // Update callback if dependencies changed
  if (!dependencies || !depsRef.current || 
      dependencies.some((dep, i) => dep !== depsRef.current[i])) {
    callbackRef.current = callback;
    depsRef.current = dependencies;
  }

  return useCallback((...args) => callbackRef.current(...args), []);
}

// Stable callback that never changes reference
export function useStableCallback(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args) => callbackRef.current(...args), []);
}
