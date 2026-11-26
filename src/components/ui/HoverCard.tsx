'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverY?: number;
  glowColor?: string;
}

export function HoverCard({
  children,
  className = '',
  hoverScale = 1.01,
  hoverY = -4,
  glowColor,
}: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        y: hoverY,
        scale: hoverScale,
        boxShadow: glowColor
          ? `0 8px 32px ${glowColor}`
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
