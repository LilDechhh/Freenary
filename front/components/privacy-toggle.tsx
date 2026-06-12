"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/app/provider";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function PrivacyToggle() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={togglePrivacyMode}
      className="relative p-2 rounded-xl bg-muted border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card hover:shadow-sm transition-all duration-300 overflow-hidden group"
      title={isPrivacyMode ? "Afficher les montants" : "Masquer les montants"}
      aria-label="Mode discret"
    >
      <div className="relative z-10 w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isPrivacyMode ? (
            <motion.div
              key="eye-off"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <EyeOff className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="eye"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <Eye className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
