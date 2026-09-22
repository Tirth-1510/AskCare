/**
 * Hero.jsx — Landing Page Hero Section
 *
 * The above-the-fold section of the AskCare landing page.
 * Contains the main headline, an interactive AI query input box, and
 * an animated healthcare SVG illustration.
 *
 * Layout: 12-column CSS grid
 *   Left  (7 cols) — Headline, subtitle, query input box, CTA buttons
 *   Right (5 cols) — Animated glassmorphic SVG healthcare illustration
 *
 * Key interactions:
 *   Query Input Box — User can type a healthcare question directly
 *   Prompt Chips    — Pre-filled example queries; clicking one fills the input
 *   Start Chat Now  — Submits the query and navigates to /chat with the question
 *   Learn More      — Smooth-scrolls to the #features section via hash anchor
 *
 * Auth-aware navigation:
 *   Authenticated users → /chat (with optional initialQuery in router state)
 *   Unauthenticated users → /login (with redirect-back state so after login,
 *     they're sent to /chat with their query intact)
 *
 * Animation:
 *   - Framer Motion fade-in/slide-up on the text column (left)
 *   - Framer Motion fade-in/slide-left on the illustration (right)
 *   - CSS float animation on the SVG for gentle up-down bobbing
 *   - Animated spinning rings around the illustration
 *   - Pulsing neon glow orbs in the background
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Send, Sparkles, HelpCircle, Activity, Heart, ShieldAlert } from 'lucide-react';

function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inputValue, setInputValue] = useState(''); // Controlled input for the query box

  // Pre-defined example prompts shown as clickable chips below the input
  const promptChips = [
    'Symptoms of Diabetes',
    'Blood Pressure Tips',
    'Healthy Diet Guidelines',
    'Fever Treatment',
    'Medication Safety check',
  ];

  /**
   * handleChipClick — Pre-fills the query input with the clicked chip text.
   * The user can then edit it before submitting.
   * @param {string} chipText — The example prompt to fill in
   */
  const handleChipClick = (chipText) => {
    setInputValue(chipText);
  };

  /**
   * handleStartChat — Handles form submission and CTA button clicks.
   *
   * Routing logic:
   *   - If input has text + authenticated → /chat with initialQuery state
   *   - If input has text + not authenticated → /login with redirect state
   *     (after login, the user is redirected to /chat with their query)
   *   - If input is empty + authenticated → /chat (new blank conversation)
   *   - If input is empty + not authenticated → /login (after login → /chat)
   *
   * @param {Event} e — Form submit or button click event
   */
  const handleStartChat = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      if (isAuthenticated) {
        // Pass the typed query as router state so Chat.jsx can auto-send it
        navigate('/chat', { state: { initialQuery: inputValue } });
      } else {
        // Send unauthenticated users to login, preserving the query for after sign-in
        navigate('/login', { state: { from: { pathname: '/chat', state: { initialQuery: inputValue } } } });
      }
    } else {
      if (isAuthenticated) {
        navigate('/chat'); // Open a blank new chat session
      } else {
        navigate('/login', { state: { from: { pathname: '/chat' } } });
      }
    }
  };

  return (
    <section id="home" className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden py-16 px-4">
      {/* Dynamic Animated Gradient Background Blurs */}
      {/* Neon glow orb — top left */}
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-brand-neon/5 blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
      {/* Purple glow orb — bottom right */}
      <div className="absolute bottom-[10%] right-[5%] w-[450px] h-[450px] rounded-full bg-[#4c3cc2]/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* ── Left Column: Content & Interactive Query Input (7/12 cols) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}   // Start invisible and 30px below
          animate={{ opacity: 1, y: 0 }}    // Animate to visible at natural position
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 flex flex-col text-center lg:text-left"
        >
          {/* AI Badge — labels the product type */}
          <div className="inline-flex items-center justify-center lg:justify-start gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#201947]/50 border border-[#4c3cc2]/30 text-brand-neon font-sans">
              <Sparkles className="h-3 w-3" />
              SLM-Powered Medical Assistant
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight font-sans">
            AI-Powered <br className="hidden sm:inline" />
            {/* Gradient text using CSS background-clip */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon via-white to-brand-neon font-sans">
              Patient Query Resolution
            </span>
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="text-base sm:text-lg text-gray-400 font-light font-sans mb-8 max-w-2xl mx-auto lg:mx-0">
            Get accurate, fast, and reliable healthcare guidance using an intelligent, lightweight Small Language Model optimized for clinical information.
          </p>

          {/* ── Large AI Assistant Query Box ────────────────────────── */}
          <div className="w-full max-w-2xl mx-auto lg:mx-0 mb-6 bg-[#0B0E14] border border-gray-800 rounded-2xl p-4 shadow-xl shadow-black/40 hover:border-gray-700/80 transition-all duration-300">
            <form onSubmit={handleStartChat} className="flex gap-2 relative items-center">
              {/* Text input — controlled component bound to inputValue state */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask your healthcare question..."
                className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all duration-200 font-sans"
              />
              {/* Submit button — positioned absolutely inside the input */}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 bg-brand-neon hover:bg-[#c6f000] text-black font-extrabold rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow shadow-brand-neon/20"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>

            {/* Example Prompt Chips — clickable shortcuts that pre-fill the query input */}
            <div className="flex flex-wrap gap-2 mt-4 items-center justify-start">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">Examples:</span>
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className="text-xs text-gray-400 bg-[#16181F] hover:bg-[#20232C] hover:text-brand-neon border border-gray-800 rounded-lg px-2.5 py-1.5 transition-all duration-200 cursor-pointer font-sans"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* ── Primary CTA Buttons ──────────────────────────────────── */}
          <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
            {/* Primary CTA — triggers the chat navigation logic */}
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 bg-brand-neon text-black font-extrabold text-sm py-3.5 px-6 rounded-xl hover:bg-[#c6f000] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-brand-neon/10 font-sans"
            >
              <span>Start Chat Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            {/* Secondary CTA — hash link scrolls to the #features section */}
            <a
              href="#features"
              className="flex items-center gap-2 bg-[#181B22] border border-gray-800 hover:border-brand-neon/30 hover:bg-[#20232C] text-white font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all duration-200 cursor-pointer font-sans"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* ── Right Column: Animated Glassmorphic SVG Illustration (5/12 cols) ── */}
        <motion.div
          initial={{ opacity: 0, x: 55 }}  // Start invisible and 55px to the right
          animate={{ opacity: 1, x: 0 }}   // Animate to visible at natural position
          transition={{ duration: 0.8, delay: 0.2 }} // Slightly delayed vs text
          className="lg:col-span-5 flex justify-center items-center"
        >
          <div className="relative w-72 h-72 sm:w-85 sm:h-85 lg:w-[400px] lg:h-[400px] flex items-center justify-center">
            {/* Background glowing orb behind the illustration */}
            <div className="absolute inset-0 bg-brand-bg-purple opacity-30 rounded-full blur-[60px] animate-pulse duration-4000"></div>

            {/* Spinning decorative rings (one clockwise, one counter-clockwise) */}
            <div className="absolute w-[95%] h-[95%] rounded-full border border-dashed border-[#4c3cc2]/20 animate-spin" style={{ animationDuration: '30s' }}></div>
            <div className="absolute w-[80%] h-[80%] rounded-full border border-double border-brand-neon/20 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}></div>

            {/* Float wrapper — applies the up/down bobbing animation */}
            <div className="relative animate-float z-10 flex items-center justify-center">
              {/* Premium Healthcare SVG Illustration */}
              <svg className="w-56 h-56 sm:w-72 sm:h-72" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Neon Shield / Hexagon Shape — the main container shape */}
                <path d="M100 20L160 50V110C160 148.66 134.33 174.33 100 185C65.67 174.33 40 148.66 40 110V50L100 20Z" fill="#181B22" stroke="#D4FF00" strokeWidth="3" strokeLinejoin="round" fillOpacity="0.85" className="drop-shadow-[0_0_20px_rgba(212,255,0,0.25)]" />
                
                {/* Medical Cross — horizontal bar */}
                <rect x="75" y="85" width="50" height="30" rx="4" fill="#201947" stroke="#4c3cc2" strokeWidth="2" />
                {/* Medical Cross — vertical bar */}
                <rect x="85" y="75" width="30" height="50" rx="4" fill="#201947" stroke="#4c3cc2" strokeWidth="2" />
                
                {/* Pulsing neon dot at the center of the cross */}
                <circle cx="100" cy="100" r="4" fill="#D4FF00" />
                
                {/* Floating Heart icon (top-right, slightly scaled down) */}
                <g className="translate-y-[-10px] translate-x-[25px] scale-[0.8] drop-shadow-[0_4px_8px_rgba(239,68,68,0.3)]">
                  <path d="M100 85 C90 70, 60 70, 60 95 C60 120, 100 140, 100 140 C100 140, 140 120, 140 95 C140 70, 110 70, 100 85 Z" fill="#EF4444" fillOpacity="0.8" />
                </g>

                {/* Warning/alert triangle (bottom-left, scaled down) */}
                <g className="translate-y-[45px] translate-x-[-35px] scale-[0.6] drop-shadow-[0_0_12px_rgba(212,255,0,0.5)]">
                  <polygon points="100,20 180,160 20,160" fill="#0B0E14" stroke="#D4FF00" strokeWidth="6" />
                  <line x1="100" y1="65" x2="100" y2="115" stroke="#D4FF00" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="100" cy="135" r="8" fill="#D4FF00" />
                </g>

                {/* Subtle grid mesh backdrop inside shield — adds depth */}
                <line x1="50" y1="60" x2="150" y2="60" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="50" y1="90" x2="150" y2="90" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="50" y1="120" x2="150" y2="120" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="50" y1="150" x2="150" y2="150" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="70" y1="30" x2="70" y2="170" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="100" y1="20" x2="100" y2="180" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="130" y1="30" x2="130" y2="170" stroke="#808080" strokeWidth="0.5" strokeOpacity="0.2" />

                {/* Slowly spinning dashed ring around the cross */}
                <circle cx="100" cy="100" r="45" stroke="#D4FF00" strokeWidth="1" strokeDasharray="5 5" strokeOpacity="0.7" className="animate-spin" style={{ animationDuration: '40s' }} />
              </svg>
            </div>
            
            {/* Small floating neon particle — top right */}
            <div className="absolute top-[15%] right-[15%] bg-brand-neon rounded-full h-2 w-2 shadow-[0_0_10px_#D4FF00] animate-bounce"></div>
            {/* Small floating red particle — bottom left, offset bounce timing */}
            <div className="absolute bottom-[20%] left-[10%] bg-[#EF4444] rounded-full h-1.5 w-1.5 shadow-[0_0_8px_#EF4444] animate-bounce" style={{ animationDelay: '1s' }}></div>
          </div>
        </motion.div>

      </div>

      {/* Inline CSS for the custom float animation (Tailwind doesn't include this) */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

export default Hero;
