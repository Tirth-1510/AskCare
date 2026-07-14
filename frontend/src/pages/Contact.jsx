import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white font-sans selection:bg-brand-neon/30 selection:text-white flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Banner */}
        <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-[#201947]/10 to-transparent blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 font-sans">
              Get in Touch
            </h1>
            <p className="text-sm sm:text-base text-gray-400 font-light font-sans max-w-xl mx-auto">
              Have questions about our SLM setup, hosting requirements, or license options? Let's connect.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Contact Info (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 font-sans">Contact Information</h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed mb-8 font-sans">
                    Reach out to our engineering and support teams directly. We aim to reply to all clinical infrastructure and hosting questions within 24 hours.
                  </p>

                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide font-sans">Email Support</h4>
                        <a href="mailto:support@askcare.ai" className="text-sm text-gray-300 hover:text-brand-neon font-semibold transition-colors font-sans">
                          support@askcare.ai
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide font-sans">Clinician Hotline</h4>
                        <span className="text-sm text-gray-300 font-semibold font-sans">
                          +1 (555) 019-2834
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide font-sans">Office Location</h4>
                        <span className="text-sm text-gray-300 font-medium font-sans block">
                          Suite 400, 100 Pine Street
                        </span>
                        <span className="text-sm text-gray-400 font-light font-sans block">
                          San Francisco, CA 94111
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-900 pt-6">
                  <div className="flex gap-3 items-center text-xs text-gray-500 font-sans">
                    <Clock className="h-4 w-4 text-brand-neon" />
                    <span>Operational hours: Monday to Friday, 9:00 AM – 6:00 PM PST</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Form Card (7 cols) */}
              <div className="lg:col-span-7">
                <div className="bg-[#11141C] border border-gray-800/80 rounded-2xl p-6 sm:p-8 relative shadow-2xl">
                  
                  {/* Toast-style Alert Inside Card */}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mb-6 bg-green-950/80 border border-green-500/30 text-green-200 rounded-xl p-4 flex gap-3 items-center text-xs font-sans"
                    >
                      <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                      <span>Thank you! Your message has been sent successfully. We'll be in touch soon.</span>
                    </motion.div>
                  )}

                  {error && (
                    <div className="mb-6 bg-red-950/80 border border-red-500/30 text-red-200 rounded-xl p-4 text-xs font-sans">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 font-sans">
                          Name <span className="text-brand-neon">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all font-sans"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 font-sans">
                          Email Address <span className="text-brand-neon">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@hospital.org"
                          className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 font-sans">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Clinical trial deployment query"
                        className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 font-sans">
                        Message <span className="text-brand-neon">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Write details of your query here..."
                        className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all font-sans resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-neon text-black font-extrabold py-3.5 rounded-xl hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 text-xs cursor-pointer shadow-lg shadow-brand-neon/10 flex items-center justify-center gap-2 font-sans"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                    </button>
                  </form>

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

export default Contact;
