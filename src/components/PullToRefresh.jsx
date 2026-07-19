import { useEffect, useRef, useState, useCallback } from 'react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const distRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  const triggerRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(40);
    try {
      await onRefreshRef.current?.();
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
      setPullDistance(0);
      distRef.current = 0;
    }
  }, []);

  useEffect(() => {
    function handleTouchStart(e) {
      if (refreshingRef.current) return;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop <= 0 && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    }

    function handleTouchMove(e) {
      if (!pulling.current) return;
      const distance = e.touches[0].clientY - startY.current;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (distance > 0 && scrollTop <= 0) {
        if (e.cancelable) e.preventDefault();
        distRef.current = Math.min(distance * 0.4, 80);
        setPullDistance(distRef.current);
      } else if (scrollTop > 0) {
        pulling.current = false;
        distRef.current = 0;
        setPullDistance(0);
      }
    }

    function handleTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (distRef.current > 50) {
        triggerRefresh();
      } else {
        distRef.current = 0;
        setPullDistance(0);
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [triggerRefresh]);

  return (
    <>
      <div className="flex justify-center items-start overflow-hidden" style={{ height: pullDistance }}>
        {pullDistance > 5 && (
          <div
            className={`w-6 h-6 mt-2 border-2 border-teal-200 border-t-teal-500 rounded-full ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
        )}
      </div>
      {children}
    </>
  );
}