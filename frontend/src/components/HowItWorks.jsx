import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, MessageSquare, Cpu, ClipboardList, ArrowRight, ArrowDown } from 'lucide-react';

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Secure Login',
      description: 'Create a new profile or log in securely to access the interactive clinical agent interface.',
      icon: UserCheck,
    },
    {
      number: '02',
      title: 'Ask Question',
      description: 'Describe your symptoms, dietary goals, or safety questions in the user prompt box.',
      icon: MessageSquare,
    },
    {
      number: '03',
      title: 'AI Processing',
      description: 'The specialized clinical SLM processes the question, analyzing medical intent.',
      icon: Cpu,
    },
    {
      number: '04',
      title: 'Receive Answer',
      description: 'Obtain formatted wellness summaries, symptom triage directions, or educational guides.',
      icon: ClipboardList,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section id="how-it-works" className="py-20 bg-[#0B0E14] relative overflow-hidden px-4">
      {/* Decorative Blur */}
      <div className="absolute left-10 top-1/3 w-[300px] h-[300px] rounded-full bg-brand-neon/3 blur-[110px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-brand-neon tracking-widest uppercase mb-3 font-sans">
            Workflow
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-sans">
            How AskCare Resolves Queries
          </h3>
          <p className="text-sm text-gray-400 font-light font-sans max-w-xl mx-auto">
            From registration to resolution: understand the simple journey of query answering.
          </p>
        </div>

        {/* Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={index}>
                <motion.div
                  variants={stepVariants}
                  className="flex flex-col items-center text-center relative group"
                >
                  {/* Step Card panel */}
                  <div className="relative w-full bg-[#181B22]/30 border border-gray-800/80 rounded-2xl p-8 flex flex-col items-center gap-4 group-hover:border-brand-neon/20 transition-all duration-300">
                    
                    {/* Floating Step Number */}
                    <span className="absolute top-4 right-4 text-xs font-black text-brand-neon font-sans bg-brand-neon/10 px-2.5 py-1 rounded-lg">
                      {step.number}
                    </span>

                    {/* Icon Sphere */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B0E14] border border-gray-800 group-hover:border-brand-neon/30 text-brand-neon group-hover:scale-105 transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h4 className="text-lg font-bold text-white font-sans mt-2">
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-light leading-relaxed font-sans">
                      {step.description}
                    </p>
                  </div>
                </motion.div>

                {/* Connectors between cards */}
                {index < 3 && (
                  <>
                    {/* Desktop Connector */}
                    <div className="hidden lg:flex absolute items-center justify-center pointer-events-none"
                         style={{ 
                           left: `calc(${(index + 1) * 25}% - 1.25rem)`,
                           top: '50%',
                           transform: 'translateY(-50%)',
                           width: '2.5rem'
                         }}
                    >
                      <ArrowRight className="h-5 w-5 text-gray-700 animate-pulse" />
                    </div>

                    {/* Mobile Connector */}
                    <div className="flex lg:hidden justify-center items-center py-2 pointer-events-none">
                      <ArrowDown className="h-5 w-5 text-brand-neon animate-bounce" />
                    </div>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}

export default HowItWorks;
