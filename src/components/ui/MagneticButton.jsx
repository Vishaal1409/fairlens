import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function MagneticButton({
  children,
  className = '',
  strength = 10,
  ...props
}) {
  const ref = useRef(null);
  const [xy, setXy] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const relX = e.clientX - r.left - r.width / 2;
    const relY = e.clientY - r.top - r.height / 2;
    setXy({
      x: (relX / (r.width / 2)) * strength,
      y: (relY / (r.height / 2)) * strength,
    });
  };

  const onLeave = () => setXy({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: xy.x, y: xy.y }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.2 }}
      className={[
        'relative inline-flex items-center justify-center rounded-xl px-5 py-3',
        'glass glass-stroke glass-card',
        'text-h font-extrabold tracking-tight',
        'hover:scale-[1.03] active:scale-[0.99] transform-gpu transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[--cyan]/70 focus-visible:ring-offset-0',
        className,
      ].join(' ')}
      {...props}
    >
      <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none glow-cyan" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

