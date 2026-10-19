import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from '../assets/images/ravindra_pro_logo_1792394034899.jpg';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Automatically fade splash screen after 2.4 seconds, or user can click
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 400);
    }, 2400);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-stone-900 via-red-950 to-stone-950 text-white"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
          </div>

          <div className="w-full flex justify-end relative z-10">
            <button
              onClick={handleSkip}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors flex items-center gap-1 backdrop-blur-md"
            >
              Skip <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Central Brand Badge */}
          <div className="flex flex-col items-center text-center relative z-10 max-w-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative mb-6"
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl shadow-red-600/40 ring-4 ring-amber-400 bg-white p-1">
                <img
                  src={logoImage}
                  alt="Ravindra Pro Orders"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" /> FAST
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-black tracking-tight"
            >
              RAVINDRA <span className="text-red-500">PRO</span>
            </motion.h1>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest"
            >
              Hostel Online Ordering
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-4 text-stone-300 text-sm leading-relaxed"
            >
              Midnight noodles, energy drinks, stationery & essentials delivered right to your hostel room.
            </motion.p>
          </div>

          {/* Bottom Loading Indicator */}
          <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-xs">
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-amber-300"
              />
            </div>
            <span className="text-[11px] font-semibold text-stone-400 tracking-wider uppercase">
              Connecting Hostel Shop...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
