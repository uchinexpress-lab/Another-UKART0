import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePageContent } from "@/lib/usePageContent";

const DEFAULT_SPLASH_IMAGE = "/ukart-splash.webp";

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const { getField, isSectionVisible, loading } = usePageContent("splash");

  const enabled = isSectionVisible("enabled", true);
  const splashImage = getField("splash_image", DEFAULT_SPLASH_IMAGE);
  const durationMs = Number(getField("duration_ms", "2100")) || 2100;

  useEffect(() => {
    if (!loading && !enabled) {
      onDone();
      return;
    }
    const t1 = setTimeout(() => setLeaving(true), durationMs);
    return () => clearTimeout(t1);
  }, [loading, enabled, durationMs]);

  if (!loading && !enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (leaving) onDone();
      }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65]"
    >
      <img
        src={splashImage}
        alt="Ukart"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    </motion.div>
  );
}
