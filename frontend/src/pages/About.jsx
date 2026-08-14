import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Cpu, ShieldCheck, MessageSquare, Activity, Users, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

function About() {
  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white font-sans selection:bg-brand-neon/30 selection:text-white flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#201947]/20 to-transparent blur-3xl pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-neon/10 border border-brand-neon/20 px-3 py-1 text-xs font-bold text-brand-neon uppercase tracking-wider mb-6">
                <Activity className="h-3.5 w-3.5" />
                About Our SLM System
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 font-sans">
                Revolutionizing Patient Query Resolution
              </h1>
              <p className="text-base sm:text-lg text-gray-400 font-light leading-relaxed max-w-2xl mx-auto font-sans">
                AskCare leverages state-of-the-art, secure Small Language Models (SLMs) to deliver fast, highly accurate, and contextual answers to patient inquiries.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Core Pillars Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-900/60 bg-[#0B0E14]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[#11141C] border border-gray-800/80 rounded-2xl p-8 hover:border-brand-neon/30 transition-all duration-300 group shadow-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon mb-6 group-hover:scale-110 transition-transform duration-200">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">On-Premises SLM</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed font-sans">
                  Powered by custom-tailored Small Language Models optimized specifically for medical query resolution, maintaining privacy and sub-second latencies.
                </p>
              </motion.div>

              {/* Pillar 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#11141C] border border-gray-800/80 rounded-2xl p-8 hover:border-brand-neon/30 transition-all duration-300 group shadow-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon mb-6 group-hover:scale-110 transition-transform duration-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">Clinical Accuracy</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed font-sans">
                  Engineered with Retrieval-Augmented Generation (RAG) referencing validated clinical guidelines, ensuring trustworthy outputs and minimizing hallucinations.
                </p>
              </motion.div>

              {/* Pillar 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#11141C] border border-gray-800/80 rounded-2xl p-8 hover:border-brand-neon/30 transition-all duration-300 group shadow-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon mb-6 group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">Empathetic UX</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed font-sans">
                  Combines advanced natural language processing with a patient-first communication tone, offering clear, digestible medical answers to users.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-900/60 bg-[#11141C]/30">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <span className="text-xs font-bold text-brand-neon uppercase tracking-wider mb-2.5 block font-sans">Our Mission</span>
              <h2 className="text-3xl font-extrabold text-white mb-6 font-sans">Bridging the Gap Between Patients and Medicine</h2>
              <p className="text-sm text-gray-400 font-light leading-relaxed mb-4 font-sans">
                Hospital administrators and clinical staff deal with a deluge of patient messages daily. AskCare is designed to safely automate the first line of responses, giving medical teams time back to focus on high-priority care.
              </p>
              <p className="text-sm text-gray-400 font-light leading-relaxed font-sans">
                By synthesizing medical guidelines and user profiles, AskCare helps patients understand complex information about their health, prescriptions, and recovery workflows without lengthy telephone wait times.
              </p>
            </div>
            
            <div className="w-full md:w-1/2 grid grid-cols-1 gap-6">
              <div className="bg-[#11141C] border border-gray-800 rounded-xl p-6 flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1.5 font-sans">Intelligent Context-Aware Routing</h4>
                  <p className="text-xs text-gray-400 font-light font-sans">System routes queries dynamically, determining when a query needs human clinician intervention.</p>
                </div>
              </div>

              <div className="bg-[#11141C] border border-gray-800 rounded-xl p-6 flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1.5 font-sans">User-Centered Care Continuity</h4>
                  <p className="text-xs text-gray-400 font-light font-sans">Provides patients with personalized profiles, historical analysis logs, and session recovery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default About;
