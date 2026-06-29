import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ExternalLink, Info } from "lucide-react";

export default function GeminiBadgeTooltip() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close when clicking outside of the tooltip container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    // Only trigger hover on desktop-size screens (coarse pointer means touch device)
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Interactive Badge Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-describedby="gemini-tooltip-content"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 bg-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800/90 border border-zinc-800 dark:border-zinc-800 border-zinc-200 text-xs font-mono text-zinc-500 dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 select-none shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          Powered by Google Gemini
        </span>
      </button>

      {/* Popover Tooltip */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="gemini-tooltip-content"
            role="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 mt-2.5 z-50 w-[320px] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-4 text-left shadow-xl shadow-black/10 dark:shadow-black/40"
          >
            {/* Small Pointer Arrow */}
            <div className="absolute top-0 left-6 -mt-1.5 w-3 h-3 rotate-45 border-t border-l border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-950" />

            {/* Title */}
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-2.5">
              <span role="img" aria-label="robot" className="text-sm">🤖</span>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Google Gemini Integration
              </h4>
            </div>

            {/* Description */}
            <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
              <p>
                Google Gemini powers the advanced intelligence of LifeSaver AI OS, acting as your empathetic and strategic scheduler.
              </p>
              
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-semibold">Implemented Features:</span>
                <ul className="space-y-1 pl-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">•</span>
                    <span>Generates custom personalized schedules</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">•</span>
                    <span>Prioritizes workloads based on urgency</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">•</span>
                    <span>Provides cognitive burnout predictions</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">•</span>
                    <span>Empathetic Twin Chat simulations</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">•</span>
                    <span>Extracts handwritten notes with Vision AI</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">•</span>
                    <span>Drafts professional extension emails</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-3.5 border-t border-zinc-100 dark:border-zinc-900 pt-2.5 flex flex-col gap-2">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal italic font-sans">
                AI responses are generated using Google Gemini based on user input.
              </p>
              
              {/* Learn More Button */}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 self-start text-[10px] font-mono font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer group"
              >
                Learn More 
                <ExternalLink className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
