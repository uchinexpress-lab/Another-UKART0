import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SPLASH_IMAGE =
  "https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/73d7699c9_ChatGPTImageAug30202607_47_33AM.png";

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2100);
    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (leaving) onDone();
      }}
      className="fixed inset-0 z-[200] bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65]"
    >
      <img
        src={SPLASH_IMAGE}
        alt="Ukart"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    </motion.div>
  );
}