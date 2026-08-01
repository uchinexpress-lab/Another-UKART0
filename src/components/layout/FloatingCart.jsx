import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronUp } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function FloatingCart() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [bump, setBump] = useState(0);
  const prevCount = useRef(itemCount);

  // When an item is added, expand and bump the cart icon.
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setExpanded(true);
      setBump((b) => b + 1);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 140, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="fixed bottom-20 left-0 right-0 z-40 px-4"
        >
          <div className="max-w-md mx-auto">
            <AnimatePresence mode="wait">
              {expanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#2E7D32] text-white rounded-2xl shadow-xl p-3 flex items-center gap-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <motion.div
                      key={bump}
                      initial={{ scale: 1.35 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 bg-white text-[#2E7D32] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/80 leading-none">
                        {itemCount} item{itemCount > 1 ? 's' : ''} added
                      </p>
                      <p className="font-bold text-sm leading-tight">₦{total.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-white/90 text-xs font-semibold px-3 py-2 rounded-full bg-white/15 active:scale-95 transition-transform whitespace-nowrap"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="bg-white text-[#2E7D32] text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-transform whitespace-nowrap"
                  >
                    Checkout
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="mini"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setExpanded(true)}
                  className="w-full bg-[#2E7D32] text-white rounded-full shadow-xl px-4 py-3 flex items-center justify-between active:scale-95 transition-transform"
                >
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <span className="relative">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="absolute -top-1.5 -right-1.5 bg-white text-[#2E7D32] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    </span>
                    View Cart
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-sm">
                    ₦{total.toLocaleString()}
                    <ChevronUp className="w-4 h-4" />
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}