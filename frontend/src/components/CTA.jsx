import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, MessageSquare, Compass } from 'lucide-react';

function CTA() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartChat = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/login', { state: { from: { pathname: '/chat' } } });
    }
  };

  return (
    <section className="py-20 bg-[#0B0E14] relative overflow-hidden px-4">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Large Gradient Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-[#201947]/90 via-[#0B0E14] to-[#181B22]/90 border border-gray-800/80 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl text-center flex flex-col items-center group"
        >
          {/* Neon background blurs inside card */}
          <div className="absolute top-[-40%] right-[-20%] w-[350px] h-[350px] rounded-full bg-brand-neon/10 blur-[90px] pointer-events-none group-hover:scale-105 transition-transform duration-500"></div>
          <div className="absolute bottom-[-40%] left-[-20%] w-[350px] h-[350px] rounded-full bg-[#4c3cc2]/20 blur-[100px] pointer-events-none"></div>

          {/* Sparkles Badge */}
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-neon/10 border border-brand-neon/20 text-brand-neon mb-6">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 font-sans max-w-3xl leading-tight">
            Start Using AI Healthcare Resolution Today
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-gray-400 font-light font-sans max-w-xl mb-10 leading-relaxed">
            Get instant educational clarifications and support for your general symptoms. Experience standard-compliant clinical guidelines in real-time.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 items-center justify-center relative z-10">
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 bg-brand-neon text-black font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-xl hover:bg-[#c6f000] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-brand-neon/15 font-sans"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Start Chat Now</span>
            </button>
            <a
              href="#features"
              className="flex items-center gap-2 bg-[#181B22] border border-gray-800 hover:border-brand-neon/30 hover:bg-[#20232C] text-white font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-xl transition-all duration-200 cursor-pointer font-sans"
            >
              <Compass className="h-4 w-4" />
              <span>Explore Features</span>
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default CTA;
