import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  fullHeight?: boolean;
  className?: string;
}

// Unified bottom sheet with high-fidelity spring motion backdrop blur and exit animations.
export function BottomSheet({ open, onClose, title, children, fullHeight, className = "" }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-end ${
            fullHeight ? "pb-[62px]" : ""
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          
          {/* Sheet Panel Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className={`relative bg-card border-t border-border rounded-t-[32px] px-5 sm:px-6 pt-3 pb-8 flex flex-col shadow-2xl overflow-y-auto scrollbar-hide ${
              fullHeight
                ? "h-[calc(100vh-4.5rem)] max-h-[calc(100%-0.5rem)] mt-2"
                : "max-h-[90vh]"
            } ${className}`}
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-3 shrink-0" />
            {title && (
              <h2 className="text-base font-black text-foreground mb-4 tracking-tight">{title}</h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
