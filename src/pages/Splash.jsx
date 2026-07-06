import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameFit } from '@/lib/GameFitContext';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated } = useGameFit();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0D0F14' }}>
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring' }}
      >
        {/* Logo */}
         <motion.img 
           src="https://media.base44.com/images/public/6a22946565d355d321574da0/c2c74fe07_GameFit_Logo.png"
           alt="GameFit Logo"
           className="h-40 object-contain mb-4"
           initial={{ opacity: 0, scale: 0.7 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.7, type: 'spring' }}
         />

         <motion.p
           className="font-body text-base"
           style={{ color: '#8A8F9E' }}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.6 }}
         >
           Fitness Progress Through Play
         </motion.p>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex gap-1.5">
            {[0, 0.2, 0.4].map((d, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#C8FF00' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: d }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}