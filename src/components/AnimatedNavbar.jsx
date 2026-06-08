// Sticky blurred navbar with glassmorphism and micro-interactions
import React from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

const Navbar = ({ children }) => {
  const [isSticky, setSticky] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setSticky(latest > 40);
  });

  return (
    <motion.nav
      initial="rest"
      animate={isSticky ? 'sticky' : 'rest'}
      variants={{
        rest: { backdropFilter: 'blur(0px)', background: 'rgba(255,255,255,0.85)', boxShadow: 'none' },
        sticky: { backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.65)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }
      }}
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
        {children}
      </div>
    </motion.nav>
  );
};

export default Navbar;
