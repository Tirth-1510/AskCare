import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity } from 'lucide-react';

const GithubIcon = ({ className = "w-4.5 h-4.5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const LinkedinIcon = ({ className = "w-4.5 h-4.5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: 'About Us', to: '/about' },
    { name: 'Features', to: '/#features' },
    { name: 'Terms of Service', to: '#terms' },
    { name: 'Privacy Policy', to: '#privacy' },
    { name: 'Contact support', to: '/contact' },
  ];

  return (
    <footer className="bg-[#0B0E14] border-t border-gray-900/80 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-neon/10 border border-brand-neon/20 text-brand-neon shadow-sm shadow-brand-neon/5">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            AskCare SLM System
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {links.map((link) => {
            const isHash = link.to.startsWith('#') || link.to.includes('/#');
            return isHash ? (
              <a
                key={link.name}
                href={link.to}
                className="text-[11px] font-semibold text-gray-500 hover:text-brand-neon transition-colors duration-150 font-sans uppercase tracking-wider"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.to}
                className="text-[11px] font-semibold text-gray-500 hover:text-brand-neon transition-colors duration-150 font-sans uppercase tracking-wider"
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Social Buttons & Copyright */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#181B22]/60 border border-gray-800 hover:border-brand-neon/30 text-gray-400 hover:text-brand-neon transition-all duration-200 cursor-pointer shadow hover:scale-105"
          >
            <GithubIcon className="h-4.5 w-4.5" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#181B22]/60 border border-gray-800 hover:border-brand-neon/30 text-gray-400 hover:text-brand-neon transition-all duration-200 cursor-pointer shadow hover:scale-105"
          >
            <LinkedinIcon className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>

      {/* Underline Copyright */}
      <div className="max-w-7xl mx-auto border-t border-gray-950 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-gray-500 font-light font-sans text-center sm:text-left">
          &copy; {currentYear} AskCare Patient Query Resolution System. All rights reserved.
        </p>
        <p className="text-[10px] text-gray-500 font-light font-sans flex items-center justify-center gap-1">
          <span>Made with</span>
          <Heart className="h-3 w-3 text-red-500 fill-current" />
          <span>for Patient Care.</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
