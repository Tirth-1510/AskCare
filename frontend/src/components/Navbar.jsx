import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Activity, MessageSquare, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', to: '/' },
    { name: 'Features', to: '/#features' },
    { name: 'About', to: '/about' },
    { name: 'Contact', to: '/contact' },
  ];

  const handleLogout = () => {
    navigate('/', { state: { logout: true }, replace: true });
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-gray-800/80 bg-[#0B0E14]/80 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-neon/10 border border-brand-neon/30 text-brand-neon group-hover:scale-105 transition-transform duration-200 shadow-sm shadow-brand-neon/20">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-sm sm:text-base font-extrabold tracking-wide text-white font-sans">
                AskCare <span className="hidden sm:inline text-gray-500 font-light font-sans">| Patient Query Resolution</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isHash = link.to.includes('#');
              return isHash ? (
                <a
                  key={link.name}
                  href={link.to}
                  className="text-xs font-semibold text-gray-400 hover:text-brand-neon hover:underline underline-offset-4 transition-all duration-200 font-sans uppercase tracking-wider"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.to}
                  className="text-xs font-semibold text-gray-400 hover:text-brand-neon hover:underline underline-offset-4 transition-all duration-200 font-sans uppercase tracking-wider"
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => navigate('/chat')} 
                  className="flex items-center gap-2 text-xs font-extrabold text-white bg-[#181B22] border border-gray-800 rounded-xl px-4 py-2 hover:bg-[#20232C] hover:border-brand-neon/30 transition-all duration-200 font-sans cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-brand-neon" />
                  <span>Chat</span>
                </button>
                <button 
                  onClick={() => navigate('/profile')} 
                  className="flex items-center gap-2 text-xs font-extrabold text-white bg-[#181B22] border border-gray-800 rounded-xl px-4 py-2 hover:bg-[#20232C] hover:border-brand-neon/30 transition-all duration-200 font-sans cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-brand-neon" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs font-extrabold text-black bg-brand-neon hover:bg-[#c6f000] hover:scale-[1.02] active:scale-[0.98] rounded-xl px-4 py-2 transition-all duration-200 font-sans cursor-pointer shadow-md shadow-brand-neon/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login', { state: { from: location } })} 
                  className="flex items-center gap-2 text-xs font-extrabold text-white bg-[#181B22] border border-gray-800 rounded-xl px-4 py-2 hover:bg-[#20232C] hover:border-brand-neon/30 transition-all duration-200 font-sans cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-brand-neon" />
                  <span>Sign In</span>
                </button>
                <button 
                  onClick={() => navigate('/register', { state: { from: location } })} 
                  className="flex items-center gap-2 text-xs font-extrabold text-black bg-brand-neon hover:bg-[#c6f000] hover:scale-[1.02] active:scale-[0.98] rounded-xl px-4 py-2 transition-all duration-200 font-sans cursor-pointer shadow-md shadow-brand-neon/5"
                >
                  <span>Sign Up</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-xl p-2 text-gray-400 hover:bg-[#181B22] hover:text-white focus:outline-none transition-colors duration-200 border border-transparent hover:border-gray-800/80 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-gray-800/80 bg-[#0B0E14] overflow-hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => {
                const isHash = link.to.includes('#');
                return isHash ? (
                  <a
                    key={link.name}
                    href={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-400 hover:bg-brand-neon/10 hover:text-brand-neon transition-all font-sans uppercase tracking-wider"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-400 hover:bg-brand-neon/10 hover:text-brand-neon transition-all font-sans uppercase tracking-wider"
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="border-t border-gray-800/80 my-4 pt-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/chat'); }}
                      className="flex items-center justify-center gap-2 w-full text-xs font-extrabold text-white bg-[#181B22] border border-gray-800 rounded-xl py-3 font-sans cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-brand-neon" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                      className="flex items-center justify-center gap-2 w-full text-xs font-extrabold text-white bg-[#181B22] border border-gray-800 rounded-xl py-3 font-sans cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-brand-neon" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="flex items-center justify-center gap-2 w-full text-xs font-extrabold text-black bg-brand-neon rounded-xl py-3 font-sans cursor-pointer shadow-md shadow-brand-neon/5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/login', { state: { from: location } }); }}
                      className="flex items-center justify-center gap-2 w-full text-xs font-extrabold text-white bg-[#181B22] border border-gray-800 rounded-xl py-3 font-sans cursor-pointer"
                    >
                      <LogIn className="h-3.5 w-3.5 text-brand-neon" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/register', { state: { from: location } }); }}
                      className="flex items-center justify-center gap-2 w-full text-xs font-extrabold text-black bg-brand-neon rounded-xl py-3 font-sans cursor-pointer shadow-md shadow-brand-neon/5"
                    >
                      <span>Sign Up</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;
