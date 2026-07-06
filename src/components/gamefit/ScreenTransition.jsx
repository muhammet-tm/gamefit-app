import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function ScreenTransition({ children, direction = 'forward' }) {
  const location = useLocation();

  const variants = {
    enter: (dir) => ({
      opacity: 0,
      x: dir === 'forward' ? 1000 : -1000,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir) => ({
      opacity: 0,
      x: dir === 'forward' ? -1000 : 1000,
    }),
  };

  return (
    <motion.div
      key={location.pathname}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}