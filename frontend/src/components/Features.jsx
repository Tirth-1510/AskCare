import React from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, Zap, BookOpen, ShieldCheck, Cpu, Smartphone } from 'lucide-react';

function Features() {
  const features = [
    {
      title: 'AI Patient Assistance',
      description: 'Interact with a custom-trained virtual health assistant optimized for patient query clarity and empathetic triage guidance.',
      icon: HeartHandshake,
    },
    {
      title: 'Instant Responses',
      description: 'Receive quick clarifications for medical questions, avoiding hours of research or long waiting lines for basic advice.',
      icon: Zap,
    },
    {
      title: 'Healthcare Knowledge',
      description: 'Leverage a model fine-tuned on reliable healthcare literature, covering symptoms, wellness tips, and anatomy details.',
      icon: BookOpen,
    },
    {
      title: 'Secure & Private',
      description: 'Your medical inquiries are private. Experience localized data flow designs that protect confidentiality first.',
      icon: ShieldCheck,
    },
    {
      title: 'Lightweight SLM',
      description: 'Driven by a Small Language Model (SLM) requiring minimal resources, offering quick inference with a small footprint.',
      icon: Cpu,
    },
    {
      title: 'Easy to Use',
      description: 'Simplified prompt box designed for patients of all ages. Just type your concerns like chatting with a friendly doctor.',
      icon: Smartphone,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: 'easeOut' } 
    },
  };

  return (
    <section id="features" className="py-20 bg-[#0B0E14] relative overflow-hidden px-4">
      {/* Decorative Blur */}
      <div className="absolute right-0 top-1/4 w-[300px] h-[300px] rounded-full bg-brand-neon/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold text-brand-neon tracking-widest uppercase mb-3 font-sans"
          >
            Capabilities
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-sans"
          >
            Premium AI Features Designed for Care
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-gray-400 font-light font-sans max-w-xl mx-auto"
          >
            We merge standard healthcare knowledge systems with lightweight AI technology to deliver immediate assistance to patients.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -6, borderColor: 'rgba(212, 255, 0, 0.4)', shadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                className="bg-[#181B22]/50 backdrop-blur-sm border border-gray-800/80 rounded-2xl p-6 md:p-8 flex flex-col items-start gap-4 transition-colors duration-300 group shadow-md"
              >
                {/* Icon Container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-neon/10 border border-brand-neon/20 text-brand-neon group-hover:bg-brand-neon group-hover:text-black transition-all duration-300 shadow-sm shadow-brand-neon/5">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-2 font-sans group-hover:text-brand-neon transition-colors duration-200">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-400 font-light leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}

export default Features;
