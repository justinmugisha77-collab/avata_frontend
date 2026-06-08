import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedNavbar from '../components/AnimatedNavbar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SUPPORT_EMAIL, SUPPORT_GMAIL_COMPOSE } from '../utils/supportContact';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch {
      alert('Failed to send message. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <AnimatedNavbar>
        <Header />
      </AnimatedNavbar>
      <main className="flex-1 flex flex-col justify-center items-center pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-6 sm:mb-8 text-blue-900 drop-shadow-lg">Contact Us</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="bg-white/80 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-xl flex flex-col justify-center">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-blue-800">AVATA (Main Shop)</h3>
              <p className="text-sm sm:text-base text-gray-700 mb-2">KG 697 St, Kigali, Rwanda</p>
              <p className="text-sm sm:text-base text-gray-700 mb-2">Phone: <a href="tel:0788305811" className="text-blue-700 hover:underline">0788 305 811</a></p>
              <p className="text-sm sm:text-base text-gray-700 mb-2">Email: <a href={SUPPORT_GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{SUPPORT_EMAIL}</a></p>
            </motion.div>
            <motion.form
              onSubmit={handleSubmit}
              className="bg-white/90 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-xl space-y-4 sm:space-y-5 md:space-y-6 flex flex-col justify-center"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <label className="block text-sm sm:text-base text-gray-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-blue-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-black placeholder-gray-400"
                  required
                  disabled={submitting}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <label className="block text-sm sm:text-base text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-blue-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-black placeholder-gray-400"
                  required
                  disabled={submitting}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <label className="block text-sm sm:text-base text-gray-700 font-semibold mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border border-blue-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-black placeholder-gray-400"
                  rows="4"
                  required
                  disabled={submitting}
                ></textarea>
              </motion.div>
              <motion.button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all text-base sm:text-lg disabled:opacity-60 disabled:cursor-not-allowed w-full"
                whileTap={{ scale: 0.97 }}
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </motion.button>
              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 font-semibold text-center pt-2 text-sm sm:text-base">
                  Thank you for contacting us! We will get back to you soon.
                </motion.div>
              )}
            </motion.form>
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold text-sm sm:text-base">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
