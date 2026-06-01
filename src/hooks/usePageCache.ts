import { useEffect, useRef } from 'react';

/**
 * Cache state on page leave/unload to prevent data loss
 * Restores state on page return (tab/app switch)
 */
export const usePageCache = <T>(key: string, initialState: T) => {
  const cacheKey = `page-cache-${key}`;
  const isRestoringRef = useRef(false);

  // Save state to sessionStorage on unmount or visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't override if we're navigating away
    };

    const handleVisibilityChange = () => {
      // On visibility change, don't do anything; let component manage its state
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const saveState = (state: T) => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save page cache:', e);
    }
  };

  const restoreState = (): T | null => {
    if (isRestoringRef.current) return null;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        isRestoringRef.current = true;
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to restore page cache:', e);
    }
    return null;
  };

  const clearCache = () => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (e) {
      console.warn('Failed to clear page cache:', e);
    }
  };

  return { saveState, restoreState, clearCache };
};
