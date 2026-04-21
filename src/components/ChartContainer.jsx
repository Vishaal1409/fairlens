import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   ChartContainer — Responsive wrapper for all dashboard charts
   ═══════════════════════════════════════════════════════════

   Props:
     title       string   — optional section label shown bottom-left
     aspectRatio number   — width/height ratio (default 16/9 ≈ 0.5625)
     minHeight   number   — minimum height in px (default 260)
     maxHeight   number   — maximum height in px (default 520)
     className   string   — extra Tailwind classes on the outer wrapper
     children    ReactNode | ((width: number, height: number) => ReactNode)
                          — pass a render-prop to receive measured size
*/

const ChartContainer = ({
  title,
  aspectRatio = 9 / 16, // height / width  →  16:9 landscape
  minHeight = 260,
  maxHeight = 520,
  className = '',
  children,
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const rawHeight = Math.round(clientWidth * aspectRatio);
    const clampedHeight = Math.min(maxHeight, Math.max(minHeight, rawHeight));
    setDimensions({ width: clientWidth, height: clampedHeight });
  }, [aspectRatio, minHeight, maxHeight]);

  /* Initial measure + ResizeObserver for live updates */
  useEffect(() => {
    measure();

    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [measure]);

  const resolvedChildren =
    typeof children === 'function'
      ? dimensions.width > 0 && dimensions.height > 0
        ? children(dimensions.width, dimensions.height)
        : null
      : children;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full relative overflow-hidden ${className}`}
      style={{ height: dimensions.height || minHeight }}
    >
      {resolvedChildren}

      {/* Optional title label */}
      {title && (
        <div className="absolute bottom-3 left-4 pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#888780]/60">
            {title}
          </span>
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ChartGrid — Responsive grid that stacks charts on mobile
              and shows them side-by-side on desktop.
   ═══════════════════════════════════════════════════════════

   Props:
     cols       number  — desktop column count (default 2)
     gap        string  — Tailwind gap class  (default 'gap-6')
     className  string  — extra classes
     children   ReactNode
*/
export const ChartGrid = ({
  cols = 2,
  gap = 'gap-6',
  className = '',
  children,
}) => {
  /* Tailwind classes for 1, 2, or 3 column grids */
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${colClasses[cols] ?? 'grid-cols-1 lg:grid-cols-2'} ${gap} ${className}`}>
      {children}
    </div>
  );
};

export default ChartContainer;
