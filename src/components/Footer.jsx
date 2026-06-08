import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_GMAIL_COMPOSE } from '../utils/supportContact';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">About Us</h3>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">More Years in the PPE industry and construction, AVATA is one of the leading importers and exporters for costruction materials and PPE.</p>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="https://facebook.com/avatatrading" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition">
                <Facebook size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="https://www.instagram.com/avata_trading_ltd?igsh=MXRwYXB3Zno0NHl5eg==" target="_blank" rel="noopener noreferrer" className="hover:text-pink-300 transition">
                <Instagram size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="https://linkedin.com/company/avatatrading" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition">
                <Linkedin size={18} className="sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">33H9+WQ5, KG 718 St, Kigali</span>
              </div>
              <div className="flex items-center">
                <Phone size={14} className="mr-2 flex-shrink-0 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">+250 788 503 811 (Irene)</span>
              </div>
              <div className="flex items-center">
                <Phone size={14} className="mr-2 flex-shrink-0 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">+250 788 565 590 (Avata trading)</span> 
              </div>
              <div className="flex items-start">
                <Mail size={14} className="mr-2 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                <a href={SUPPORT_GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm break-all hover:text-blue-300 transition underline underline-offset-2">{SUPPORT_EMAIL}</a>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Policies</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><Link to="#" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition">Terms and Conditions</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition">Return & Exchange Policy</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition">Delivery Information</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Shop with Us</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><Link to="/my-account" className="hover:text-blue-400 transition">My Account</Link></li>
              <li><Link to="/my-account" className="hover:text-blue-400 transition">Your Orders</Link></li>
              <li><Link to="/cart" className="hover:text-blue-400 transition">Your Cart</Link></li>
              <li><Link to="/advertisement" className="hover:text-blue-400 transition">Advertisement</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm">&copy; 2026 AVATA Trading Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
