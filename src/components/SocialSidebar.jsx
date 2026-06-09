import React from 'react';
import { FaEnvelope, FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { SUPPORT_GMAIL_COMPOSE } from '../utils/supportContact';

export const links = [
  {
    label: 'Gmail',
    url: SUPPORT_GMAIL_COMPOSE,
    bg: 'bg-[#EA4335]',
    icon: <FaEnvelope className="text-white text-lg" />,
  },
  {
    label: 'Facebook',
    url: 'https://www.facebook.com/share/1D8LNmZJoZ/',
    bg: 'bg-[#1877F2]',
    icon: <FaFacebookF className="text-white text-xl" />,
  },
  {
    label: 'Instagram',
    url: 'https://www.instagram.com/avata_trading_ltd?igsh=MXRwYXB3Zno0NHl5eg==',
    bg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    icon: <FaInstagram className="text-white text-xl" />,
  },
  {
    label: 'TikTok',
    url: 'https://www.tiktok.com/@avata.trading.ltd?_r=1&_t=ZS-94BQ3IDab1E',
    bg: 'bg-black',
    icon: <FaTiktok className="text-white text-xl" />,
  }
];

const SocialSidebar = ({ side = 'right' }) => (
  <div className={`fixed ${side === 'right' ? 'right-1' : 'left-1'} top-1/2 z-50 flex transform -translate-y-1/2 flex-col items-center gap-3 select-none`}>
    {links.map((link) => (
      <a
        key={link.label}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex flex-col items-center gap-1 rounded-full transition-all duration-300 ${side === 'right' ? 'hover:-translate-x-1' : 'hover:translate-x-1'}`}
      >
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${link.bg} shadow-inner shadow-black/10`}>
          {React.cloneElement(link.icon, { className: 'text-white text-sm' })}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-yellow-400">
          {link.label}
        </span>
      </a>
    ))}
  </div>
);

export default SocialSidebar;
