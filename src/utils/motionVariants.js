// Framer Motion animation utilities for Home page
import { motion, AnimatePresence } from 'framer-motion';

export const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
};

export const heroTextReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } }
};

export const cardHover = {
  rest: { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  hover: { scale: 1.04, boxShadow: '0 8px 24px rgba(0,0,0,0.16)', transition: { duration: 0.2 } }
};

export const navbarBlur = {
  rest: { backdropFilter: 'blur(0px)', background: 'rgba(255,255,255,0.85)' },
  sticky: { backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.65)', transition: { duration: 0.3 } }
};

export const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

export const buttonTap = {
  rest: { scale: 1 },
  tap: { scale: 0.96, transition: { duration: 0.1 } }
};
