import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const HIDDEN_ON = ["/cart", "/order", "/checkout"];

export default function FloatingCart() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const prevCount = useRef(itemCount);
  const [bump, setBump] = useState(0);

  // Micro-pop whenever the item count changes (added or removed).
  useEffect(() => {
    if (itemCount !== prevCount.current) {
      setBump((b) => b + 1);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  return (
    <AnimatePresence>
      {itemCount > 0 && !HIDDEN_ON.some((p) => location.pathname.startsWith(p)) && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="fixed bottom-24 right-4 z-40 flex flex-col items-center"
        >
          <motion.button
            onClick={() => navigate("/cart")}
            whileTap={{ scale: 0.88 }}
            className="relative w-14 h-14 rounded-full bg-[#2E7D32] shadow-lg shadow-[#2E7D32]/35 flex items-center justify-center"
            aria-label="View cart"
          >
            <ShoppingBag className="w-6 h-6 text-white" strokeWidth={2.2} />
            <motion.span
              key={bump}
              initial={{ scale: 1.45 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              className="absolute -top-1 -right-1 bg-white text-[#2E7D32] text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow border-2 border-[#2E7D32]"
            >
              {itemCount}
            </motion.span>
          </motion.button>
          <span className="mt-1.5 bg-white text-[#2E7D32] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            ₦{total.toLocaleString()}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}