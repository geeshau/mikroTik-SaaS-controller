'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function StaggeredList({ children, staggerDelay, className }: StaggeredListProps) {
  const containerVariant = staggerDelay
    ? { ...container, show: { ...container.show, transition: { staggerChildren: staggerDelay } } }
    : container;

  return (
    <motion.div
      variants={containerVariant}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
