/**
 * Home.jsx — Landing Page
 *
 * The main marketing/landing page of AskCare.
 * Composes all landing page sections in a single scrollable layout.
 *
 * Page sections (top to bottom):
 *   Navbar       — Sticky top navigation with auth-aware links
 *   Hero         — Above-the-fold hero with the AI query input box
 *   Statistics   — Key metrics (users, queries, accuracy, etc.)
 *   Features     — Feature cards explaining what AskCare offers
 *   HowItWorks   — Step-by-step process explanation
 *   Benefits     — Benefits of using AskCare over traditional methods
 *   Testimonials — User testimonial carousel
 *   FAQ          — Accordion FAQ section
 *   CTA          — Call-to-action banner with sign-up prompt
 *   Footer       — Site footer with links and credits
 *
 * Logout handling:
 *   The Navbar's logout button navigates to '/' with { state: { logout: true } }.
 *   Home.jsx detects this flag in location.state and calls logout() from AuthContext.
 *   After clearing auth state, it replaces the history state to prevent the logout
 *   from being re-triggered on back/forward navigation or page refresh.
 */

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

  // Handle logout redirect: Navbar navigates here with { state: { logout: true } }
  // This pattern avoids calling logout() inside the Navbar which could cause
  // React state updates during navigation/unmount cycles
  useEffect(() => {
    if (location.state?.logout) {
      logout(); // Clear token and user from state + localStorage
      // Clear location state to prevent repeating the logout call
      // on back/forward navigation or refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, logout]);

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white font-sans selection:bg-brand-neon/30 selection:text-white">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main>
        {/* 1. Hero Section — AI query input + headline */}
        <Hero />

        {/* 2. Statistics Section — Animated counters for key metrics */}
        <Statistics />

        {/* 3. Features Section — Feature cards grid */}
        <Features />

        {/* 4. How It Works Section — 3-step process illustration */}
        <HowItWorks />

        {/* 5. Benefits Section — Advantage list vs traditional methods */}
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
