import React from 'react';
import {
  Plus, Tag, Percent, Home, Users, Package,
  FolderTree, ShoppingCart, PieChart, User, MessageSquare, X, ClipboardList, Video, CreditCard, Image
} from 'lucide-react';

const AdminSidebar = ({ active, setActiveView, mobileMenuOpen, setMobileMenuOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'reports', label: 'Reports', icon: ClipboardList },
    { id: 'payment-options', label: 'Payment Options', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'special-offer', label: 'Special Offers', icon: Percent },
    { id: 'hero-media', label: 'Hero Video', icon: Video },
    { id: 'advertisement', label: 'Advertisement', icon: Image }
  ];

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white flex flex-col shadow-xl transition-transform duration-300 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-y-auto`}>
      <div className="p-6 flex items-center justify-between">
        <div className="text-2xl font-extrabold tracking-widest flex items-center gap-2">
          <Home size={28} /> Admin
        </div>
        <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-white/80 hover:text-white">
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-4 pb-10">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${active === item.id ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
            onClick={() => { setActiveView(item.id); setMobileMenuOpen(false); }}
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 text-xs text-blue-200 border-t border-blue-400/30 bg-black/10">AVATA Admin Panel v2.0</div>
    </aside>
  );
};

export default AdminSidebar;
