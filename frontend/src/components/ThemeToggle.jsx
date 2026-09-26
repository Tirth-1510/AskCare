import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false, compact = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-300 cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${
        compact ? 'p-2 text-xs' : 'px-3 py-2 text-xs'
      } ${
        isDark
          ? 'bg-[#181B22] text-gray-300 border border-gray-800 hover:border-amber-400/40 hover:text-amber-400 hover:bg-[#20232C] shadow-sm'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400/60 hover:text-indigo-600 hover:bg-slate-50 shadow-sm'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center w-4 h-4">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="text-amber-400 group-hover:text-amber-300 transition-colors"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="text-slate-700 group-hover:text-indigo-600 transition-colors"
            >
              <Moon className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="font-semibold text-xs font-sans tracking-wide">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
