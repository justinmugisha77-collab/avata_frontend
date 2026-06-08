import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Advertisement from './pages/Advertisement';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Workwear from './pages/Workwear';
import workWear from './pages/work-wear';
import dustmusk from './pages/dustmusk';
import Earprotection from './pages/earprotection';
import Eyeprotection from './pages/eyeprotection';
import Fallprotection from './pages/fallprotection';
import Firep from './pages/firep';
import Firstaid from './pages/firstaid';
import Footprotection from './pages/footprotection';
import Gloves from './pages/gloves';
import HeadProduction from './pages/HeadProduction';
import headprotection from './pages/headprotection';
import Ladders from './pages/ladders';
import roadsafety from './pages/roadsafety';
import ResetPassword from './pages/ResetPassword';
import { useAuth } from './contexts/AuthContext';

// Global scroll-to-top component
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/about" element={<About />} /> */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/advertisement" element={<Advertisement />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/orders" element={<Navigate to="/my-account" replace />} />
        <Route path="/my-account" element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/owner" element={<ProtectedRoute requiredRole="owner"><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/workwear" element={<Workwear />} />
        <Route path="/work-wear" element={<workWear />} />
        <Route path="/dustmusk" element={<dustmusk />} />
        <Route path="/earprotection" element={<Earprotection />} />
        <Route path="/eyeprotection" element={<Eyeprotection />} />
        <Route path="/fallprotection" element={<Fallprotection />} />
        <Route path="/firep" element={<Firep />} />
        <Route path="/firstaid" element={<Firstaid />} />
        <Route path="/footprotection" element={<Footprotection />} />
        <Route path="/gloves" element={<Gloves />} />
        <Route path="/HeadProduction" element={<HeadProduction />} />
        <Route path="/headprotection" element={<headprotection />} />
        <Route path="/ladders" element={<Ladders />} />
        <Route path="/roadsafety" element={<roadsafety />} />
      </Routes>
    </Router>
  );
}

export default App;
