import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react';

function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Patient',
      text: 'AskCare gave me instant guidance on blood pressure tips when I was worried at 2 AM. The resolution suggestions are extremely clear, easy to read, and helpful!',
      avatarText: 'SJ',
      avatarColor: 'bg-brand-neon/20 text-brand-neon border-brand-neon/30',
    },
    {
      name: 'Dr. Marcus Vance',
      role: 'General Practitioner',
      text: 'Having a lightweight SLM assistant to resolve patient informational queries reduces our triage burdens immensely. It acts as an excellent initial health resource.',
      avatarText: 'MV',
      avatarColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      name: 'Alex Chen',
      role: 'Medical Student',
      text: 'I use this system daily to test clinical question-answering formats. The response accuracy and speed is incredibly impressive for a lightweight local model.',
      avatarText: 'AC',
      avatarColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-[#0B0E14] relative overflow-hidden px-4">
      {/* Background radial highlight */}
      <div className="absolute right-1/4 bottom-0 w-[400px] h-[400px] rounded-full bg-brand-bg-purple/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-brand-neon tracking-widest uppercase mb-3 font-sans">
            Reviews
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-sans">
            What Users Are Saying
          </h3>
          <p className="text-sm text-gray-400 font-light font-sans max-w-md mx-auto">
            Read experience reports from patient care triages, general practitioners, and medical scholars.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative bg-[#181B22]/30 border border-gray-800/80 rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-8 items-center min-h-[300px]">
          
          {/* Quote mark ornament */}
          <div className="absolute top-6 left-6 text-brand-neon/10 pointer-events-none">
            <Quote className="h-16 w-16 fill-current" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col md:flex-row gap-8 items-center w-full relative z-10"
            >
              {/* Avatar Sphere */}
              <div className="shrink-0 flex items-center justify-center">
                <div className={`h-20 w-20 rounded-full border flex items-center justify-center text-xl font-extrabold font-sans shadow-lg shadow-black/40 ${testimonials[activeIndex].avatarColor}`}>
                  {testimonials[activeIndex].avatarText}
                </div>
              </div>

              {/* Text Area */}
              <div className="flex-grow flex flex-col text-center md:text-left">
                <p className="text-sm sm:text-base text-gray-300 italic font-light leading-relaxed mb-6 font-sans">
                  "{testimonials[activeIndex].text}"
                </p>
                <div>
                  <h4 className="text-base font-bold text-white font-sans">
                    {testimonials[activeIndex].name}
                  </h4>
                  <p className="text-xs text-brand-neon font-semibold font-sans mt-0.5">
                    {testimonials[activeIndex].role}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Toggles (Bottom/Right side) */}
          <div className="flex md:flex-col gap-3 justify-center items-center shrink-0 mt-6 md:mt-0 relative z-10">
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0E14] border border-gray-800 hover:border-brand-neon/40 text-gray-400 hover:text-brand-neon transition-all duration-200 cursor-pointer shadow hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0E14] border border-gray-800 hover:border-brand-neon/40 text-gray-400 hover:text-brand-neon transition-all duration-200 cursor-pointer shadow hover:scale-105"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex ? 'w-6 bg-brand-neon' : 'w-2 bg-gray-800'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export default Testimonials;
