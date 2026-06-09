import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, X, MessageCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { links as socialLinks } from './SocialSidebar';

const ContactSidebar = ({ side = 'right' }) => {
  const [isOpen, setIsOpen] = useState(true);

  const contacts = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: FaWhatsapp,
      bgColor: 'bg-emerald-500 hover:bg-emerald-600',
      link: 'https://wa.me/250788305811' // Replace with actual number
    },
    {
      id: 'call',
      label: 'Call Us',
      icon: Phone,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      link: 'tel:+250788305811' // Replace with actual number
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      bgColor: 'bg-purple-600 hover:bg-purple-700',
      link: 'mailto:contact@avata.rw' // Replace with actual email
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: side === 'right' ? 100 : -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: side === 'right' ? 100 : -100 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-20 ${side === 'right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} z-40 flex flex-col gap-3`}
        >
          {/* Social links rendered as bordered buttons */}
          <div className="flex flex-col gap-2">
            {socialLinks.map((s, index) => (
              <motion.a
                key={`social-${s.label}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ scale: 1.03, x: side === 'right' ? -6 : 6 }}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-white text-sm font-semibold shadow-lg transition-all duration-200 ${s.bg} hover:shadow-xl`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  {s.icon}
                </span>
                <span>{s.label}</span>
              </motion.a>
            ))}
          </div>

          {/* Contact Buttons */}
          {contacts.map((contact, index) => {
            const IconComponent = contact.icon;
            return (
              <motion.a
                key={contact.id}
                href={contact.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (socialLinks.length + index) * 0.04 }}
                whileHover={{ scale: 1.03, x: side === 'right' ? -6 : 6 }}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-white text-sm font-semibold shadow-lg transition-all duration-200 ${contact.bgColor}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <IconComponent className="w-4 h-4" />
                </span>
                <span>{contact.label}</span>
              </motion.a>
            );
          })}
        </motion.div>
      )}

      {/* Toggle Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: [1, 1.03, 1] }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-5 ${side === 'right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} z-40 w-14 h-14 rounded-full text-white font-bold shadow-[0_30px_60px_rgba(139,92,246,0.25)] transition-all duration-200 flex items-center justify-center bg-gradient-to-br from-fuchsia-500 via-violet-500 to-orange-500`}
        title={isOpen ? 'Close' : 'Open contacts'}
      >
        <motion.div
          initial={false}
          animate={isOpen ? { rotate: 180, y: [0, -4, 0] } : { rotate: 0, y: [0, -4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </motion.div>
        {!isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white"
          >
            !
          </motion.span>
        )}
      </motion.button>
    </AnimatePresence>
  );
};

export default ContactSidebar;
