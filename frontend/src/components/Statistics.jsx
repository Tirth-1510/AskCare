import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Target, Clock, Smile } from 'lucide-react';

function Counter({ value, suffix = '', duration = 2000, trigger }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, ''));
    if (start === end) return;

    // Find the incremental step time
    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
    let timer = setInterval(() => {
      start += Math.ceil(end / 60); // step increments
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, trigger]);

  // Format count to commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return <span>{formatNumber(count)}{suffix}</span>;
}

function Statistics() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const stats = [
    {
      label: 'Patients Assisted',
      targetVal: 10000,
      suffix: '+',
      icon: Users,
      desc: 'Health queries resolved globally.',
    },
    {
      label: 'Accuracy',
      targetVal: 95,
      suffix: '%',
      icon: Target,
      desc: 'Validated medical mapping.',
    },
    {
      label: 'Average Response',
      targetVal: 2,
      prefix: '< ',
      suffix: ' sec',
      icon: Clock,
      desc: 'Realtime clinical feedback loops.',
    },
    {
      label: 'Satisfaction Rate',
      targetVal: 98,
      suffix: '%',
      icon: Smile,
      desc: 'Favorable rating by user reviews.',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-[#0B0E14] relative overflow-hidden px-4 border-y border-gray-900/60">
      {/* Decorative Blur */}
      <div className="absolute left-[40%] top-1/4 w-[350px] h-[350px] rounded-full bg-[#4c3cc2]/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-[#181B22]/30 border border-gray-800/80 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg relative group overflow-hidden"
              >
                {/* Accent line on hover */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-neon scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                {/* Sphere Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B0E14] text-brand-neon border border-gray-800 group-hover:border-brand-neon/30 transition-colors duration-300 mb-4">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Counter */}
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 font-sans">
                  {stat.prefix}
                  <Counter value={stat.targetVal} suffix={stat.suffix} trigger={isInView} />
                </div>

                {/* Label */}
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 font-sans">
                  {stat.label}
                </h4>
                
                {/* Description */}
                <p className="text-[10px] text-gray-500 font-light font-sans max-w-[180px]">
                  {stat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default Statistics;
