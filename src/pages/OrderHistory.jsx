import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Clock, CheckCircle, Upload, Eye, ArrowLeft, AlertCircle,
  ShoppingBag, MapPin, Phone, Mail, User as UserIcon, MessageSquare,
  Send, Truck, X, FileText, RefreshCw, Ban, Trash2, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import getFullImageUrl from '../utils/getFullImageUrl';

const API = 'http://localhost:5000';

const STEPS = [
  { id: 1, label: 'Order Placed', icon: Package },
  { id: 2, label: 'Payment Submitted', icon: Upload },
  { id: 3, label: 'Payment Verified', icon: CheckCircle },
  { id: 4, label: 'Order Confirmed', icon: Star },
  { id: 5, label: 'Delivered', icon: Truck },
  { id: 6, label: 'Completed', icon: CheckCircle },
];

function ScrollToTop() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
}

function getOrderStepState(order) {
  const status = String(order.status || '').toLowerCase();
  const paymentStatus = String(order.payment_status || '').toLowerCase();
  const verificationStatus = String(order.verification_status || '').toLowerCase();
  const hasSubmittedProof = Boolean(order.payment_proof || order.payment_proof_file || paymentStatus === 'awaiting_verification');
  const paymentVerified = paymentStatus === 'verified' || paymentStatus === 'paid' || verificationStatus === 'approved';

  if (status === 'not_delivered') {
    return { current: 5, failed: 5 };
  }

  if (status === 'completed') {
    return { current: 6, completed: true };
  }

  if (status === 'delivered') {
    return { current: 5 };
  }

  if (status === 'shipped' || status === 'paid') {
    return { current: 4 };
  }

  if (paymentVerified) {
    return { current: 3 };
  }

  if (hasSubmittedProof) {
    return { current: 2 };
  }

  return { current: 1 };
}

function StatusBadge({ order }) {
  const s = order.payment_status;
  const os = order.status;
  const vs = order.verification_status;

  if (os === 'Completed' || os === 'completed') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-300 shadow-md">✅ COMPLETED</span>;
  if (os === 'Not_Delivered') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-100 to-orange-100 text-red-800 border-2 border-red-300 animate-pulse shadow-md">❌ NOT DELIVERED</span>;
  if (os === 'Delivered' || os === 'delivered') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-2 border-indigo-300 animate-pulse shadow-md">🚚 DELIVERED - Confirm Below</span>;
  if (os === 'Shipped') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-300 shadow-md">📦 SHIPPED</span>;
  if (os === 'Paid' || vs === 'approved' || s === 'verified') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300 shadow-md">🟢 PAYMENT CONFIRMED</span>;
  if (vs === 'rejected') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-300 animate-pulse shadow-md">❌ PROOF REJECTED</span>;
  if (os === 'Payment_Under_Review' || vs === 'pending' || s === 'awaiting_verification') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300 shadow-md">⏳ UNDER REVIEW</span>;
  if (os === 'Waiting_Proof' || s === 'pending') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-2 border-orange-300 shadow-md">⏰ UPLOAD PROOF</span>;
  if (os === 'Cancelled') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-2 border-gray-300 shadow-md">🚫 CANCELLED</span>;
  if (os === 'sent') return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-2 border-blue-300 shadow-md">📱 SENT VIA WHATSAPP</span>;

  return <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-2 border-orange-300 shadow-md">⏰ UPLOAD PROOF</span>;
}

function ProgressBar({ order }) {
  const { current, failed, completed } = getOrderStepState(order);
  const stepPalette = {
    1: 'bg-slate-700 border-slate-700 text-white shadow-lg shadow-slate-200',
    2: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200',
    3: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200',
    4: 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200',
    5: 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-200',
    6: 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200',
  };

  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const stepNumber = idx + 1;
        const done = completed ? stepNumber <= current : stepNumber < current;
        const active = stepNumber === current && !completed && !failed;
        const isFailed = failed === stepNumber;
        const isLast = idx === STEPS.length - 1;
        const circleClass = isFailed
          ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
          : done
            ? (stepPalette[stepNumber] || 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200')
            : active
              ? `${stepPalette[stepNumber] || 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'} animate-pulse`
              : 'bg-gray-100 border-gray-300 text-gray-400';
        const labelClass = isFailed
          ? 'text-red-600'
          : done || active
            ? 'text-gray-900'
            : 'text-gray-400';
        const connectorClass = failed && stepNumber < failed
          ? 'bg-red-400'
          : done
            ? (stepPalette[stepNumber]?.split(' ')[0] || 'bg-green-500')
            : 'bg-gray-200';

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${circleClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className={`mt-1.5 text-xs font-medium text-center max-w-[72px] leading-tight ${labelClass}`}>{step.label}</p>
            </div>
            {!isLast && (
              <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${connectorClass}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [commentSuccess, setCommentSuccess] = useState({});
  const [sendingComment, setSendingComment] = useState(null);
  const [uploadMode, setUploadMode] = useState({}); // orderId -> 'file'|null
  const [uploading, setUploading] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [nowTick, setNowTick] = useState(Date.now());
  const [proofModal, setProofModal] = useState({ open: false, url: '' });
  const [paymentOptions, setPaymentOptions] = useState(null);
  const fileRefs = useRef({});
  const proofModalUrl = proofModal.url || '';
  const isProofPdf = /\.pdf($|\?)/i.test(proofModalUrl);

  const token = localStorage.getItem('token');

  useEffect(() => { loadOrders(); }, []);

  // Auto-refresh orders every 30 seconds to catch status updates from admin
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [token, user]);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPaymentOptions = async () => {
      try {
        if (!token) return;
        const response = await fetch(`${API}/api/payments/options`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.success && payload?.options) {
          setPaymentOptions(payload.options);
        }
      } catch (_error) {
        // Keep checkout/order pages usable even if options request fails.
      }
    };

    loadPaymentOptions();
  }, [token]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (token && user?.id) {
        const res = await fetch(`${API}/api/orders/myorders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
          setLastUpdated(Date.now());
        }
      } else {
        const local = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(local.filter(o => o.customer_email === (user?.email || localStorage.getItem('customerEmail'))));
        setLastUpdated(Date.now());
      }
    } catch {
      const local = JSON.parse(localStorage.getItem('orders') || '[]');
      setOrders(local.filter(o => o.customer_email === user?.email));
      setLastUpdated(Date.now());
    } finally { setLoading(false); }
  };

  const loadComments = async (orderId) => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setComments(prev => ({ ...prev, [orderId]: d.comments || [] }));
    } catch { }
  };

  const toggleExpand = (orderId) => {
    if (expandedOrderId === orderId) { setExpandedOrderId(null); return; }
    setExpandedOrderId(orderId);
    if (!comments[orderId]) loadComments(orderId);
  };

  const sendComment = async (orderId) => {
    const text = newComments[orderId]?.trim();
    if (!text || !token) return;
    setSendingComment(orderId);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: text })
      });
      const d = await r.json();
      if (d.success) {
        setComments(prev => ({ ...prev, [orderId]: d.comments || [] }));
        setNewComments(prev => ({ ...prev, [orderId]: '' }));
        setCommentSuccess(prev => ({ ...prev, [orderId]: 'Message sent successfully.' }));
        setTimeout(() => {
          setCommentSuccess(prev => ({ ...prev, [orderId]: '' }));
        }, 2200);
      } else {
        alert(d.message || 'Failed to send comment. Please try again.');
      }
    } catch (_error) {
      alert('Failed to send comment. Please check your connection and try again.');
    } finally { setSendingComment(null); }
  };

  const uploadProofFile = async (orderId, file) => {
    if (!file) return;
    setUploading(orderId);
    const fd = new FormData();
    fd.append('payment_proof_file', file);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/payment-proof-upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
      });
      const d = await r.json();
      if (d.success) { loadOrders(); setUploadMode(prev => ({ ...prev, [orderId]: null })); }
      else alert(d.message || 'Upload failed');
    } catch { alert('Upload failed. Please try again.'); }
    finally { setUploading(null); }
  };

  

  const removeProof = async (orderId) => {
    if (!window.confirm('Remove this proof? You can upload a new one after removing.')) return;
    setUploading(orderId);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/payment-proof`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json().catch(() => ({}));
      if (d.success) {
        loadOrders();
      } else {
        alert(d.message || 'Failed to remove proof');
      }
    } catch {
      alert('Failed to remove proof. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const cancelMyOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/cancel-my-order`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        alert('Your order has been cancelled successfully.');
        loadOrders();
      } else {
        alert(data.message || 'Failed to cancel order.');
      }
    } catch {
      alert('Failed to cancel order. Please try again.');
    }
  };

  const confirmDelivery = async (orderId, confirmed) => {
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirmed })
      });
      const data = await res.json();
      if (data.success) {
        alert(confirmed ? 'Thank you for confirming your delivery!' : 'We have noted that you did not receive your order. Our team will contact you.');
        loadOrders();
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white shadow-sm hover:shadow transition text-gray-600 hover:text-gray-900 flex-shrink-0">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600" /> My Orders
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Track and manage all your orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="text-right flex-1 sm:flex-initial">
              <button 
                onClick={loadOrders} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-50 hover:border-blue-300 transition shadow-sm group"
                title="Refresh orders"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-blue-600 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-gray-700 group-hover:text-blue-600">Refresh</span>
              </button>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">
                Updated {Math.floor((nowTick - lastUpdated) / 1000)}s ago
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/my-account')}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
              >
                My Account
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent mx-auto" />
            <p className="mt-4 text-gray-600 font-medium text-sm sm:text-base">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No Orders Yet</h3>
            <p className="text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">You haven't placed any orders yet.</p>
            <button onClick={() => navigate('/products')} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all text-sm sm:text-base">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => {
              const orderId = order.id || order.orderId;
              const isExpanded = expandedOrderId === orderId;
              const isUploading = uploading === orderId;
              const mode = uploadMode[orderId] || null;
              const proof = order.payment_proof_file || order.payment_proof;
              const proofLocked =
                order.status === 'Paid' ||
                order.status === 'Delivered' ||
                order.status === 'Completed' ||
                order.status === 'Cancelled' ||
                order.status === 'Not_Delivered' ||
                order.payment_status === 'Paid' ||
                order.payment_status === 'verified' ||
                order.verification_status === 'approved';
              const statusLower = String(order.status || '').toLowerCase();
              const paymentStatusLower = String(order.payment_status || '').toLowerCase();
              const verificationLower = String(order.verification_status || '').toLowerCase();
              const canCancel = !(
                ['delivered', 'completed', 'cancelled', 'not_delivered', 'paid'].includes(statusLower)
                || ['paid', 'verified'].includes(paymentStatusLower)
                || verificationLower === 'approved'
              );
              const canUseReceipt = (
                (order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid')
                && (order.status === 'Delivered' || order.status === 'delivered' || order.status === 'Completed' || order.status === 'completed' || order.status === 'Shipped')
              );

              return (
                <div key={orderId} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Order #{orderId}</h3>
                          <p className="text-blue-100 text-sm">
                            {new Date(order.created_at || order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{(order.total_amount || order.total || 0).toLocaleString()} RWF</p>
                        <p className="text-blue-100 text-sm">{order.items?.length || 0} item(s)</p>
                      </div>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className="px-6 py-2.5 bg-white border-b border-gray-100">
                    <StatusBadge order={order} />
                  </div>

                  <div className="p-6">
                    {/* Progress */}
                    <div className="mb-6 overflow-x-auto">
                      <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Order Progress</h4>
                      <ProgressBar order={order} />
                    </div>

                    {/* Toggle details */}
                    <button
                      onClick={() => toggleExpand(orderId)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 font-medium border border-blue-100 rounded-xl hover:bg-blue-50 transition"
                    >
                      {isExpanded ? 'Hide Details' : 'View Order Details & Actions'}
                    </button>

                    {isExpanded && (
                      <div className="mt-5 space-y-5">
                        {/* Items */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                            <ShoppingBag className="w-4 h-4 text-blue-600" /> Items ({order.items?.length || 0})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                {item.image ? (
                                  <img src={getFullImageUrl(item.image)} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{item.name || item.product_name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity} × {(item.price || 0).toLocaleString()} RWF</p>
                                  <p className="text-sm font-bold text-blue-600 mt-1">{((item.price || 0) * (item.quantity || 1)).toLocaleString()} RWF</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-3 mt-3 border-t">
                            <span className="font-semibold text-gray-700">Total</span>
                            <span className="text-2xl font-bold text-blue-600">{(order.total_amount || order.total || 0).toLocaleString()} RWF</span>
                          </div>
                        </div>

                        {/* Extra Features side buttons */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-wide mb-2">Extra Features</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!expandedOrderComments[orderId]) {
                                  loadOrderComments(orderId);
                                  setExpandedOrderComments(prev => ({ ...prev, [orderId]: true }));
                                }
                              }}
                              className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                            >
                              Message / Comment
                            </button>
                            <button
                              type="button"
                              disabled={!canUseReceipt}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${API}/api/orders/${orderId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                  if (!res.ok) { alert('Receipt not available yet'); return; }
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                } catch (e) { console.error(e); alert('Failed to load receipt'); }
                              }}
                              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              View Receipt
                            </button>
                            <button
                              type="button"
                              disabled={!canUseReceipt}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${API}/api/orders/${orderId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
                                  if (!res.ok) { alert('Receipt not available yet'); return; }
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `AVATA-Receipt-Order-${orderId}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(url);
                                  alert('Receipt downloaded successfully!');
                                } catch (e) { console.error(e); alert('Failed to download receipt'); }
                              }}
                              className="px-3 py-2 rounded-lg bg-white border border-indigo-300 text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Download Receipt
                            </button>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-xs text-blue-700 font-semibold mb-2 uppercase tracking-wide">Payment Numbers</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-900">
                            <p><span className="font-semibold">BK:</span> {paymentOptions?.bank_bk_account || 'Not set'}</p>
                            <p><span className="font-semibold">Equity:</span> {paymentOptions?.bank_equity_account || 'Not set'}</p>
                            <p><span className="font-semibold">MTN Mobile Money:</span> {paymentOptions?.mobile_mtn_number || 'Not set'}</p>
                            <p><span className="font-semibold">Airtel Money:</span> {paymentOptions?.mobile_airtel_number || 'Not set'}</p>
                          </div>
                          {paymentOptions?.notes && <p className="text-xs text-blue-700 mt-2">{paymentOptions.notes}</p>}
                        </div>

                        {/* Payment Proof section */}
                        <div className="border border-gray-100 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-blue-600" /> Payment Proof
                          </h4>

                          {/* Already submitted */}
                          {proof && (
                            <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl ${order.payment_status === 'verified' ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${order.payment_status === 'verified' ? 'text-green-600' : 'text-yellow-500'}`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {order.payment_status === 'verified' ? 'Payment proof verified ✓' : 'Proof submitted – awaiting review'}
                                </p>
                                {order.verified_at && (
                                  <p className="text-xs text-gray-500 mt-0.5">Verified: {new Date(order.verified_at).toLocaleString()}</p>
                                )}
                              </div>
                              <button
                                onClick={() => setProofModal({ open: true, url: proof.startsWith('/uploads') ? `${API}${proof}` : proof })}
                                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100"
                              >
                                <Eye className="w-4 h-4" /> View
                              </button>
                              {!proofLocked && (
                                <button
                                  onClick={() => removeProof(orderId)}
                                  className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4" /> Remove
                                </button>
                              )}
                            </div>
                          )}

                          {proof && !proofLocked && (
                            <div className="mb-3">
                              {!mode ? (
                                <button
                                  onClick={() => setUploadMode(prev => ({ ...prev, [orderId]: 'file' }))}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                                >
                                  <Upload className="w-4 h-4" /> Upload New Proof
                                </button>
                              ) : null}
                            </div>
                          )}

                          {/* Customer Confirmation Buttons - Show for Shipped or Delivered orders ONLY if payment is approved */}
                          {String(order.status || '').toLowerCase() === 'delivered' && (
                            <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-inner">
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-indigo-600" />
                                <p className="text-base font-bold text-indigo-900">Have you received your order?</p>
                              </div>
                              <p className="text-sm text-gray-600 text-center mb-4">
                                Please confirm delivery status once you receive your order
                              </p>
                              <div className="flex justify-center">
                                <button
                                  onClick={() => confirmDelivery(orderId, true)}
                                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                                >
                                  <CheckCircle className="w-5 h-5" /> Yes, I Received It
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Show message if order is shipped but payment not approved */}
                          {String(order.status || '').toLowerCase() === 'shipped' &&
                           !(order.payment_status === 'verified' || order.payment_status === 'Paid' || order.status === 'Paid') &&
                           order.status !== 'Completed' && 
                           order.status !== 'Not_Delivered' && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <p className="text-sm font-medium text-yellow-800">
                                  Delivery confirmation will be available once your payment is approved by admin.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Show confirmation message after customer action */}
                          {(order.status === 'Completed') && (
                            <div className="mt-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-inner">
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <p className="text-base font-bold text-green-900">✅ You confirmed this order was delivered successfully!</p>
                              </div>
                            </div>
                          )}

                          {(order.status === 'Not_Delivered') && (
                            <div className="mt-4 p-5 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl shadow-inner">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                                <p className="text-base font-bold text-red-900">You reported this order was not delivered</p>
                              </div>
                              <p className="text-sm text-red-700 text-center">Our support team will contact you shortly to resolve this issue.</p>
                            </div>
                          )}

                          {/* Upload options — only if still pending or rejected */}
                          {((order.status === 'Waiting_Proof' || order.payment_status === 'pending' || order.verification_status === 'rejected') && !proof) || (!proofLocked && mode) ? (
                            <div className="mt-2">
                              {order.verification_status === 'rejected' && (
                                <div className="mb-4 bg-red-50 px-4 py-3 rounded-xl border border-red-200 flex items-start gap-3">
                                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="text-sm text-red-800">
                                    <p className="font-bold mb-1">Upload New Proof Required</p>
                                    <p>Your previous payment proof was rejected. Please upload a clear screenshot of your bank transfer or Mobile Money receipt.</p>
                                  </div>
                                </div>
                              )}
                              {!mode ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <button
                                    onClick={() => setUploadMode(prev => ({ ...prev, [orderId]: 'file' }))}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-blue-500/25"
                                  >
                                    <Upload className="w-4 h-4" /> Upload Image / PDF
                                  </button>
                                  
                                </div>
                              ) : mode === 'file' ? (
                                <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-blue-900">Upload Document</span>
                                    <button onClick={() => setUploadMode(prev => ({ ...prev, [orderId]: null }))} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    ref={el => fileRefs.current[orderId] = el}
                                    className="hidden"
                                    onChange={e => e.target.files[0] && uploadProofFile(orderId, e.target.files[0])}
                                  />
                                  <button
                                    onClick={() => fileRefs.current[orderId]?.click()}
                                    disabled={isUploading}
                                    className="w-full py-4 border-2 border-dashed border-blue-300 bg-white rounded-xl text-sm font-medium text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 group flex flex-col items-center gap-2"
                                  >
                                    <Upload className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition" />
                                    {isUploading ? 'Uploading Please Wait...' : 'Click to select image or PDF file'}
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-gray-900">Provide Document Link</span>
                                    <button onClick={() => setUploadMode(prev => ({ ...prev, [orderId]: null }))} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      type="url"
                                      value={proofUrls[orderId] || ''}
                                      onChange={e => setProofUrls(prev => ({ ...prev, [orderId]: e.target.value }))}
                                      placeholder="e.g. https://drive.google.com/..."
                                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                                    />
                                    <button
                                      onClick={() => submitProofUrl(orderId)}
                                      disabled={isUploading}
                                      className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition shadow-md"
                                    >
                                      {isUploading ? 'Sending...' : 'Submit Link'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {canCancel && (
                            <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-xl">
                              <button
                                onClick={() => cancelMyOrder(orderId)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                              >
                                <Ban className="w-4 h-4" /> Cancel This Order
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Comments */}
                        <div className="border border-gray-100 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-blue-600" /> Messages
                          </h4>
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {!(comments[orderId]?.length) ? (
                              <p className="text-xs text-gray-400 italic">No messages yet.</p>
                            ) : (comments[orderId] || []).map(c => (
                              <div key={c.id} className={`flex gap-2 ${c.author_role !== 'customer' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-xs px-3 py-2 rounded-xl text-xs shadow-sm ${c.author_role !== 'customer' ? 'bg-blue-50 border border-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>
                                  <p className="font-semibold opacity-70 mb-0.5">{c.author_role !== 'customer' ? `${c.author_name} (Staff)` : 'You'}</p>
                                  <p>{c.comment}</p>
                                  <p className="opacity-40 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {isAuthenticated && token && (
                            <div>
                              <div className="flex gap-2">
                                <input
                                  value={newComments[orderId] || ''}
                                  onChange={e => setNewComments(prev => ({ ...prev, [orderId]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && sendComment(orderId)}
                                  placeholder="Write a message..."
                                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                                <button
                                  onClick={() => sendComment(orderId)}
                                  disabled={sendingComment === orderId}
                                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                              {commentSuccess[orderId] && (
                                <p className="mt-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                                  {commentSuccess[orderId]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Proof Modal - Fully Responsive */}
      {proofModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={() => setProofModal({ open: false, url: '' })}>
          <div className="relative w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[90vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> Payment Proof
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={proofModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white text-xs sm:text-sm font-semibold"
                >
                  Open
                </a>
                <button
                  onClick={() => setProofModal({ open: false, url: '' })}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition text-white"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-60px)] sm:max-h-[calc(90vh-80px)]">
              {isProofPdf ? (
                <iframe
                  src={proofModalUrl}
                  title="Payment Proof PDF"
                  className="w-full min-h-[65vh] rounded-lg shadow-lg border border-gray-200"
                />
              ) : (
                <img
                  src={proofModalUrl}
                  alt="Payment Proof"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666" font-size="16"%3EUnable to load image%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OrderHistory;
