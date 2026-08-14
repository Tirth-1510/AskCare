import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Benefits from '../components/Benefits';
import Statistics from '../components/Statistics';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

function Home() {
  const { logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.logout) {
      logout();
      // Clear location state to prevent repeating the logout call
      window.history.replaceState({}, document.title);
    }
  }, [location.state, logout]);

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white font-sans selection:bg-brand-neon/30 selection:text-white">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Statistics Section */}
        <Statistics />

        {/* 3. Features Section */}
        <Features />

        {/* 4. How It Works Section */}
        <HowItWorks />

        {/* 5. Benefits Section */}
        <Benefits />

        {/* 6. Testimonials Carousel Section */}
        <Testimonials />

        {/* 7. FAQ Accordion Section */}
        <FAQ />

        {/* 8. Call To Action (CTA) Banner */}
        <CTA />
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}

export default Home;
