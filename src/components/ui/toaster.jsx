import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, AlertCircle } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex flex-col items-center gap-2 p-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, title, description, action, variant }) => (
          <motion.div
            key={id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.7, right: 0.7 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 90) dismiss(id);
            }}
            className={`pointer-events-auto flex items-center gap-2.5 max-w-[360px] w-full rounded-2xl border shadow-lg pl-4 pr-1.5 py-2.5 ${
              variant === "destructive"
                ? "bg-[#B91C1C] text-white border-[#B91C1C]"
                : "bg-white text-gray-900 border-gray-100"
            }`}
          >
            {variant === "destructive" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-[#2E7D32] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {title && <p className="text-sm font-medium truncate">{title}</p>}
              {description && (
                <p className="text-xs opacity-80 truncate">{description}</p>
              )}
            </div>
            {action}
            <button
              onClick={() => dismiss(id)}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition ${
                variant === "destructive"
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-gray-400 hover:text-gray-700 hover:bg-black/5"
              }`}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}