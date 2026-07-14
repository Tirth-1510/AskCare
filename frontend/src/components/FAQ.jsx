import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

function FAQ() {
  const faqs = [
    {
      question: 'What is an SLM and how does it differ from traditional LLMs?',
      answer: 'A Small Language Model (SLM) is a lightweight neural network (typically containing 1B to 7B parameters) optimized for specific task domains. Unlike giant Large Language Models (LLMs) that require massive server clusters, an SLM fine-tuned on clinical datasets is highly responsive, cost-effective, and capable of running locally or on modest hardware constraints while retaining precise accuracy for patient triage.',
    },
    {
      question: 'Is my query data secure and private?',
      answer: 'Absolutely. Privacy is a central tenet of clinical tools. Because our system is built around specialized Small Language Models, patient information does not need to be processed by public third-party APIs or shared for training. Computation is bounded securely to protect patient confidentiality.',
    },
    {
      question: 'Can I use this for official medical diagnoses?',
      answer: 'No. AskCare is an informational health assistant designed to resolve patient queries, summarize general clinical wellness, and provide education on symptoms or medication guidelines. It is not a replacement for professional clinical advice, emergency triage, or doctor diagnoses.',
    },
    {
      question: 'How does the system achieve sub-2 second response times?',
      answer: 'Giant models require network roundtrips to remote cloud facilities and queue processing. Our Small Language Model is compact enough to run in optimized local environments, dramatically accelerating token generation speeds. This ensures patients receive accurate informational summaries in real-time.',
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="contact" className="py-20 bg-[#0B0E14] relative overflow-hidden px-4 border-t border-gray-900/60">
      {/* Background blurs */}
      <div className="absolute left-[-10%] bottom-[10%] w-[300px] h-[300px] rounded-full bg-brand-neon/3 blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-brand-neon tracking-widest uppercase mb-3 font-sans">
            Questions
          </h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4 font-sans">
            Frequently Asked Questions
          </h3>
          <p className="text-sm text-gray-400 font-light font-sans max-w-md mx-auto">
            Find answers to common questions about our SLM healthcare assistant system.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className="bg-[#181B22]/30 border border-gray-800/80 rounded-2xl overflow-hidden hover:border-gray-700/80 transition-all duration-300 shadow-md"
              >
                {/* Header Toggle */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4.5 w-4.5 text-brand-neon shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-white font-sans tracking-wide">
                      {faq.question}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 text-gray-400 hover:text-white"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.div>
                </button>

                {/* Body Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="border-t border-gray-950 p-5 sm:p-6 bg-[#0B0E14]/50">
                        <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed font-sans">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default FAQ;
