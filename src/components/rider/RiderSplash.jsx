import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bike } from 'lucide-react';

/**
 * Rider-specific splash screen — separate branding from the customer app.
 * Dark green gradient with a bike/delivery visual treatment.
 */
export default function RiderSplash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2100);
    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onAnimationComplete={() => {
        if (leaving) onDone();
      }}
      className="fixed inset-0 z-[200] bg-gradient-to-br from-[#1B4332] via-[#2E7D32] to-[#1B4332] flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 border border-white/20 shadow-xl">
          <Bike className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Ukart Rider</h1>
        <p className="text-sm text-green-200/70 mt-2 font-medium tracking-wide">
          Delivery Operations
        </p>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '120px' }}
        transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.5 }}
        className="h-1 rounded-full bg-white/30 mt-8 overflow-hidden"
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.5, repeat: Infinity }}
          className="h-full w-1/2 bg-[#5FCF65] rounded-full"
        />
      </motion.div>
    </motion.div>
  );
}