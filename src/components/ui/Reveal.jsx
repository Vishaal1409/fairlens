import React from 'react';
import { motion } from 'framer-motion';

export default function Reveal({
  children,
  delay = 0,
  y = 18,
  once = true,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

