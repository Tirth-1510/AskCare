import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, HeartPulse, Activity } from 'lucide-react';

function Benefits() {
  const benefits = [
    { title: 'Accurate Responses', desc: 'Clinical context mapping helps reduce generic query hallucinations.' },
    { title: '24/7 Availability', desc: 'No appointments or queues. Clear wellness and educational guides, day or night.' },
    { title: 'Fast Performance', desc: 'Optimized local model architecture guarantees responses in milliseconds.' },
    { title: 'Secure System', desc: 'Local computation boundaries verify data confidentiality.' },
    { title: 'Personalized Guidance', desc: 'System replies are calibrated to match the user\'s language and detail needs.' },
    { title: 'Modern AI Technology', desc: 'Powered by highly optimized state-of-the-art Small Language Models.' },
  ];

  return (
    <section id="about" className="py-20 bg-[#0B0E14] relative overflow-hidden px-4">
      {/* Decorative Glow */}
      <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#4c3cc2]/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Healthcare Vector Illustration (cols: 5) */}
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 flex justify-center order-2 lg:order-1"
        >
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px] flex items-center justify-center">
            {/* Ambient Circle BG */}
            <div className="absolute w-[90%] h-[90%] rounded-full bg-brand-bg-purple/20 border border-gray-800/80 animate-pulse"></div>

            {/* Glowing heartbeat path */}
            <div className="absolute animate-float">
              <svg className="w-52 h-52 sm:w-64 sm:h-64" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Glass Ring */}
                <circle cx="100" cy="100" r="85" stroke="rgba(212,255,0,0.15)" strokeWidth="4" />
                <circle cx="100" cy="100" r="70" stroke="rgba(76,60,194,0.3)" strokeWidth="1.5" />

                {/* Inner Hexagon Panel */}
                <polygon points="100,50 143,75 143,125 100,150 57,125 57,75" fill="#181B22" fillOpacity="0.8" stroke="#D4FF00" strokeWidth="2" className="drop-shadow-[0_0_15px_rgba(212,255,0,0.2)]" />

                {/* ECG Heartbeat pulse line */}
                <path d="M65,100 L85,100 L90,85 L95,115 L100,70 L105,125 L110,95 L115,105 L120,100 L135,100" stroke="#D4FF00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(212,255,0,0.6)]" />

                {/* Floating Heart Icon badge */}
                <circle cx="140" cy="65" r="18" fill="#0B0E14" stroke="#4c3cc2" strokeWidth="1.5" />
                <path d="M140,61 C137,57 131,57 131,63 C131,70 140,75 140,75 C140,75 149,70 149,63 C149,57 143,57 140,61 Z" fill="#EF4444" className="scale-[0.8]" style={{ transformOrigin: '140px 65px' }} />

                {/* Floating Shield Icon badge */}
                <circle cx="60" cy="135" r="18" fill="#0B0E14" stroke="#4c3cc2" strokeWidth="1.5" />
                <path d="M60,127 L69,131 V137 C69,142 60,146 60,146 C60,146 51,142 51,137 V131 L60,127 Z" fill="#D4FF00" fillOpacity="0.8" className="scale-[0.7]" style={{ transformOrigin: '60px 135px' }} />
              </svg>
            </div>
            
            {/* Spinning decorative ticks */}
            <div className="absolute w-full h-full border border-dashed border-[#4c3cc2]/20 rounded-full animate-spin" style={{ animationDuration: '40s' }}></div>
          </div>
        </motion.div>

        {/* Right Side: Checklist (cols: 7) */}
        <motion.div
          initial={{ opacity: 0, x: 35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 flex flex-col order-1 lg:order-2"
        >
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-xs font-bold text-brand-neon tracking-widest uppercase mb-3 font-sans">
              Advantages
            </h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4 font-sans">
              Why Patient Query Resolution Matters
            </h3>
            <p className="text-sm text-gray-400 font-light font-sans">
              Empowering healthcare access. Our architecture ensures you receive high-quality support without sacrificing performance or safety constraints.
            </p>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3.5 p-4 bg-[#181B22]/30 border border-gray-800/80 rounded-xl hover:border-brand-neon/10 transition-colors duration-200"
              >
                <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 font-sans">
                    {benefit.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-light leading-relaxed font-sans">
                    {benefit.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

export default Benefits;
