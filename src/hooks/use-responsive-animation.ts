import { useState, useEffect, useCallback } from 'react';

// Lightweight hook to determine if we're on mobile
// Returns simple boolean rather than complex animation calculations
export function useResponsiveAnimation() {
  // Default to desktop to prevent layout shift
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Use useCallback to memoize the checkSize function
  const checkSize = useCallback(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;

    // Use function form of setState to avoid issues with stale closure
    setIsMobile(prev => {
      const newValue = width < 768;
      // Only update if value changed to avoid render loops
      return prev !== newValue ? newValue : prev;
    });

    setIsTablet(prev => {
      const newValue = width >= 768 && width < 1024;
      return prev !== newValue ? newValue : prev;
    });
  }, []);

  useEffect(() => {
    // Initial check
    checkSize();

    // Add lightweight throttled resize handler
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        checkSize();
        resizeTimer = null;
      }, 250); // Throttle to reduce performance impact
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }
    };
  }, [checkSize]); // Dependency on the memoized checkSize

  // Return simple boolean values for responsive design
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  };
}

export default useResponsiveAnimation;
