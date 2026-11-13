import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const HIDDEN_ON = ["/cart", "/checkout", "/order", "/orders/"];
const POS_KEY = "ukart_cart_fab_pos";
const WIDTH = 56;
const HEIGHT = 86; // button + price pill
const MARGIN = 10;

function clampPos(p) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.min(Math.max(p.x, MARGIN), Math.max(MARGIN, vw - WIDTH - MARGIN)),
    y: Math.min(Math.max(p.y, MARGIN), Math.max(MARGIN, vh - HEIGHT - MARGIN)),
  };
}

function defaultPos() {
  return {
    x: window.innerWidth - WIDTH - 16,
    y: window.innerHeight - HEIGHT - 100,
  };
}

export default function FloatingCart() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const prevCount = useRef(itemCount);
  const [bump, setBump] = useState(0);
  const [pos, setPos] = useState(null);
  const drag = useRef(null);

  // Restore the last dragged position, and keep it on screen when resizing.
  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    } catch {
      saved = null;
    }
    setPos(saved ? clampPos(saved) : defaultPos());
    const onResize = () => setPos((p) => (p ? clampPos(p) : defaultPos()));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Micro-pop whenever the item count changes (added or removed).
  useEffect(() => {
    if (itemCount !== prevCount.current) {
      setBump((b) => b + 1);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  const onPointerDown = (e) => {
    if (!pos) return;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) d.moved = true;
    if (d.moved) setPos(clampPos({ x: d.originX + dx, y: d.originY + dy }));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      navigate("/cart");
      return;
    }
    // Snap to nearest horizontal edge for a native feel.
    setPos((p) => {
      if (!p) return p;
      const vw = window.innerWidth;
      const snapX = p.x + WIDTH / 2 < vw / 2 ? MARGIN : vw - WIDTH - MARGIN;
      const snapped = clampPos({ x: snapX, y: p.y });
      localStorage.setItem(POS_KEY, JSON.stringify(snapped));
      return snapped;
    });
  };

  const hidden = HIDDEN_ON.some((p) => location.pathname.startsWith(p));
  const justAdded = bump > 0 && itemCount > prevCount.current;

  return (
    <AnimatePresence>
      {itemCount > 0 && !hidden && pos && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          style={{
            left: pos.x,
            top: pos.y,
            touchAction: "none",
            transition: drag.current ? "none" : "left 0.25s cubic-bezier(0.16,1,0.3,1), top 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="fixed z-40 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
          role="button"
          aria-label="View cart"
        >
          <motion.div
            animate={justAdded ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={justAdded ? { duration: 0.35, ease: "easeOut" } : { type: "spring", stiffness: 420, damping: 22 }}
            className="relative w-14 h-14 rounded-full bg-[#2E7D32] shadow-lg shadow-[#2E7D32]/35 flex items-center justify-center active:scale-90 transition-transform"
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
            {justAdded && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-[#2E7D32]"
              />
            )}
          </motion.div>
          <span className="mt-1.5 bg-white text-[#2E7D32] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            ₦{total.toLocaleString()}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}