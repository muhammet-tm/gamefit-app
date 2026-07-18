import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ children, onRefresh, disabled = false }) {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (disabled || isRefreshing || startY === 0) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !disabled && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <>
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center"
          style={{ height: `${pullDistance}px`, overflow: 'hidden' }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullDistance > 60 ? 180 : 0 }}
            transition={{ duration: isRefreshing ? 0.6 : 0.2, repeat: isRefreshing ? Infinity : 0 }}
          >
            <RefreshCw size={20} style={{ color: 'var(--gf-text-secondary)' }} />
          </motion.div>
        </div>
      )}

      {/* Content scrollable container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ paddingTop: Math.max(0, pullDistance) }}
      >
        {children}
      </div>
    </>
  );
}