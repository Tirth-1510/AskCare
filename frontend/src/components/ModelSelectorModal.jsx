import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Zap, Cpu, Brain, ShieldCheck, Sparkles,
  Gauge, Layers, ArrowRight, ShieldAlert, Activity
} from 'lucide-react';

/**
 * ModelSelectorModal — Production-Grade Clinical Model Selection Dialog
 *
 * Provides a responsive, accessible modal for switching between:
 *   1. Mistral 7B Instruct (Production Default & Recommended)
 *   2. Ministral 8B (High Precision & Edge Optimized)
 *   3. Mistral Small 4 (119B MoE Deep Clinical Reasoning)
 *   4. AskCare SmolLM2 Medical (Specialized Edge SLM)
 */
export default function ModelSelectorModal({
  isOpen,
  onClose,
  availableModels = [],
  selectedModel,
  onSelectModel
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Model-specific theme definitions
  const getModelTheme = (modelId) => {
    const id = (modelId || '').toLowerCase();
    if (id.includes('7b')) {
      return {
        icon: Zap,
        accentColor: 'text-amber-300',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400/30',
        badgeBg: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
        activeGlow: 'ring-2 ring-amber-400/70 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.15)] bg-[#17140B]'
      };
    }
    if (id.includes('8b')) {
      return {
        icon: Cpu,
        accentColor: 'text-sky-300',
        bgColor: 'bg-sky-400/10',
        borderColor: 'border-sky-400/30',
        badgeBg: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
        activeGlow: 'ring-2 ring-sky-400/70 border-sky-400/80 shadow-[0_0_30px_rgba(56,189,248,0.15)] bg-[#0B151F]'
      };
    }
    if (id.includes('small') || id.includes('moe')) {
      return {
        icon: Brain,
        accentColor: 'text-purple-300',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400/30',
        badgeBg: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
        activeGlow: 'ring-2 ring-purple-400/70 border-purple-400/80 shadow-[0_0_30px_rgba(192,132,252,0.15)] bg-[#150F1F]'
      };
    }
    return {
      icon: ShieldCheck,
      accentColor: 'text-emerald-300',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30',
      badgeBg: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
      activeGlow: 'ring-2 ring-emerald-400/70 border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.15)] bg-[#0B1A14]'
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-3xl bg-[#0B0E14] border border-gray-800 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] p-5 sm:p-7 z-10 font-sans text-white max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-5 border-b border-gray-800/80 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-neon/10 border border-brand-neon/30 text-brand-neon shadow-[0_0_20px_rgba(212,255,0,0.15)]">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-sans">
                      Clinical Intelligence Engine
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                      Multi-Model
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-sans">
                    Switch between clinical inference models anytime during your consultation thread
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800/70 border border-transparent hover:border-gray-700 transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Model Cards Grid */}
            <div className="py-5 overflow-y-auto flex-grow space-y-3.5 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {availableModels.map((model) => {
                  const isSelected = model.id === selectedModel;
                  const theme = getModelTheme(model.id);
                  const IconComponent = theme.icon;

                  return (
                    <div
                      key={model.id}
                      onClick={() => onSelectModel(model.id)}
                      className={`relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group ${
                        isSelected
                          ? `${theme.activeGlow}`
                          : 'bg-[#0E121B] border-gray-800/80 hover:border-gray-700 hover:bg-[#131723] hover:shadow-lg'
                      }`}
                    >
                      {/* Top Row: Icon + Name + Badge + Checkmark */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${theme.bgColor} ${theme.borderColor} ${theme.accentColor} group-hover:scale-105 transition-transform`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white tracking-tight font-sans">
                                  {model.name}
                                </h3>
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {model.provider}
                              </span>
                            </div>
                          </div>

                          {/* Selected Radio / Check Icon */}
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="h-6 w-6 rounded-full bg-brand-neon text-black flex items-center justify-center shadow-[0_0_12px_rgba(212,255,0,0.4)]">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-gray-700 group-hover:border-gray-500 transition-colors" />
                            )}
                          </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          {model.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${theme.badgeBg}`}>
                              {model.badge}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-gray-800/60 text-gray-300 border border-gray-700/60">
                            {model.speed}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                          {model.description}
                        </p>
                      </div>

                      {/* Specs Footer */}
                      <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Context:</span>
                          <span className="text-gray-300 font-bold">{model.contextWindow}</span>
                        </div>

                        {isSelected ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-neon flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Active Model
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-500 group-hover:text-gray-300 transition-colors">
                            Click to activate →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer Info Bar */}
            <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-3 shrink-0 bg-[#0B0E14]">
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  All models adhere to evidence-based medical triage rules and multi-turn patient memory.
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-mono hidden sm:inline-block">
                Click any model to switch
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
