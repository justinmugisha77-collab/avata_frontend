import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, User as UserIcon, Mail, FileText, CheckCircle, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import getFullImageUrl from '../utils/getFullImageUrl';
import { SUPPORT_EMAIL } from '../utils/supportContact';

const Payment = () => {
  const CHECKOUT_DRAFT_KEY = 'avata_checkout_draft';
  const navigate = useNavigate();
  const { user, isAuthenticated, saveRedirectPath } = useAuth();
  const { cart, clearCart, getCartTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [hasSubmittedOrder, setHasSubmittedOrder] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const hasPushedBackGuardRef = useRef(false);
  const supportEmail = SUPPORT_EMAIL;
  const [orderData, setOrderData] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    delivery_address: '',
    notes: ''
  });

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hasDraftData = useMemo(() => {
    return Object.values(orderData).some((value) => String(value || '').trim().length > 0);
  }, [orderData]);

  useEffect(() => {
    try {
      const savedDraftRaw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!savedDraftRaw) return;
      const savedDraft = JSON.parse(savedDraftRaw);
      if (!savedDraft || typeof savedDraft !== 'object') return;

      setOrderData((prev) => ({
        ...prev,
        ...savedDraft,
        customer_name: savedDraft.customer_name || user?.full_name || prev.customer_name,
        customer_email: savedDraft.customer_email || user?.email || prev.customer_email,
        customer_phone: savedDraft.customer_phone || user?.phone || prev.customer_phone
      }));
    } catch (_e) {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    }
  }, [user?.full_name, user?.email, user?.phone]);

  useEffect(() => {
    if (hasSubmittedOrder) {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      return;
    }

    if (!hasDraftData) {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      return;
    }

    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(orderData));
  }, [orderData, hasDraftData, hasSubmittedOrder]);

  useEffect(() => {
    if (loading || hasSubmittedOrder || !hasDraftData) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, hasSubmittedOrder, hasDraftData]);

  useEffect(() => {
    if (loading || hasSubmittedOrder || !hasDraftData) return undefined;
    if (!hasPushedBackGuardRef.current) {
      window.history.pushState({ checkoutGuard: true }, '');
      hasPushedBackGuardRef.current = true;
    }

    const handlePopState = () => {
      const shouldLeave = window.confirm('You have an unfinished order form. Do you want to leave this page?');
      if (!shouldLeave) {
        window.history.pushState({ checkoutGuard: true }, '');
        return;
      }
      hasPushedBackGuardRef.current = false;
      setTimeout(() => navigate(-1), 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loading, hasSubmittedOrder, hasDraftData, navigate]);

  useEffect(() => {
    if (hasSubmittedOrder) return;
    if (!isAuthenticated) {
      saveRedirectPath('/payment');
      navigate('/cart');
      return;
    }

    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, cart, navigate, saveRedirectPath, hasSubmittedOrder]);

  useEffect(() => {
    const loadPaymentOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://localhost:5000/api/payments/options', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.success && payload?.options) {
          setPaymentOptions(payload.options);
        }
      } catch (_error) {
        // Intentionally silent; options are optional for checkout completion.
      }
    };

    if (isAuthenticated) {
      loadPaymentOptions();
    }
  }, [isAuthenticated]);

  const handleInputChange = (e) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const generateOrderId = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  };

  const formatOrderForWhatsApp = (orderId) => {
    const total = getCartTotal();
    let message = `*🛒 New Order from AVATA TRADING*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *Order ID:* ${orderId}\n`;
    message += `📅 *Date:* ${new Date().toLocaleString()}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 *Customer Details:*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `• *Name:* ${orderData.customer_name}\n`;
    message += `• *Email:* ${orderData.customer_email}\n`;
    message += `• *Phone:* ${orderData.customer_phone}\n`;
    message += `• *Address:* ${orderData.delivery_address}\n\n`;
    message += `📦 *Order Items:*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    cart.forEach((item, index) => {
      const imageUrl = getFullImageUrl(item.selectedImage || item.image);
      message += `\n*Item ${index + 1}:*\n`;
      message += `  📝 Name: ${item.name}\n`;
      message += `  🔢 Quantity: ${item.quantity}\n`;
      message += `  💰 Price: RWF ${item.price.toLocaleString()}\n`;
      message += `  💵 Subtotal: RWF ${(item.price * item.quantity).toLocaleString()}\n`;
      if (imageUrl) {
        message += `  🖼️ Image: ${imageUrl}\n`;
      }
      if (item.category) {
        message += `  📂 Category: ${item.category}\n`;
      }
      if (item.selected_size) {
        message += `  📏 Size: ${item.selected_size}\n`;
      }
      if (item.selected_color) {
        message += `  🎨 Color: ${item.selected_color}\n`;
      }
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💳 *Total Amount: RWF ${total.toLocaleString()}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (orderData.notes) {
      message += `📝 *Notes:* ${orderData.notes}\n\n`;
    }

    message += `✅ Please confirm receipt of this order.\n\n`;
    message += `_Thank you for shopping with AVATA TRADING!_`;

    return encodeURIComponent(message);
  };

  const saveOrderToFile = async (orderId, orderSource = 'whatsapp') => {
    const orderDetails = {
      orderId,
      date: new Date().toISOString(),
      customer: {
        name: orderData.customer_name,
        email: orderData.customer_email,
        phone: orderData.customer_phone,
        address: orderData.delivery_address
      },
      delivery_address: orderData.delivery_address,
      items: cart.map(item => ({
        id: item.id,
        special_offer_id: item.special_offer_id || null,
        item_type: item.item_type || null,
        name: item.name,
        category: item.category,
        selected_size: item.selected_size || null,
        selected_color: item.selected_color || null,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        image: getFullImageUrl(item.selectedImage || item.image)
      })),
      total: getCartTotal(),
      notes: orderData.notes,
      status: orderSource === 'whatsapp' ? 'sent' : 'submitted',
      order_source: orderSource,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      total_amount: getCartTotal()
    };

    // Save to backend
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderDetails)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.message || 'Failed to save order');
      error.status = response.status;
      error.details = payload?.details;
      throw error;
    }

    return payload;
  };

  const validateCartStock = async () => {
    const checks = await Promise.all(cart.map(async (item) => {
      try {
        if (item?.special_offer_id) {
          const response = await fetch(`http://localhost:5000/api/special-offers/${item.special_offer_id}`);
          if (!response.ok) {
            return { ok: false, item, reason: 'not_found' };
          }
          const payload = await response.json();
          const fresh = payload?.offer || null;
          const stock = Number(fresh?.stock ?? 0);
          const requested = Number(item.quantity || 0);
          if (!Number.isFinite(stock) || stock <= 0) {
            return { ok: false, item, reason: 'out_of_stock', stock: 0 };
          }
          if (requested > stock) {
            return { ok: false, item, reason: 'insufficient', stock };
          }
          return { ok: true, item, stock };
        }

        const response = await fetch(`http://localhost:5000/api/products/${item.id}`);
        if (!response.ok) {
          return { ok: false, item, reason: 'not_found' };
        }
        const fresh = await response.json();
        const stock = Number(fresh?.stock ?? 0);
        const requested = Number(item.quantity || 0);
        if (!Number.isFinite(stock) || stock <= 0) {
          return { ok: false, item, reason: 'out_of_stock', stock: 0 };
        }
        if (requested > stock) {
          return { ok: false, item, reason: 'insufficient', stock };
        }
        return { ok: true, item, stock };
      } catch (_e) {
        return { ok: false, item, reason: 'network' };
      }
    }));

    return checks.filter(c => !c.ok);
  };

  const handleSubmitOrder = async (e, orderType = 'whatsapp') => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const invalidItems = await validateCartStock();
    if (invalidItems.length > 0) {
      const first = invalidItems[0];
      if (first.reason === 'out_of_stock') {
        alert(`${first.item.name} is out of stock. Please remove it from your cart.`);
      } else if (first.reason === 'insufficient') {
        alert(`${first.item.name} has only ${first.stock} item(s) available. Please update quantity before checkout.`);
      } else {
        alert('Could not validate stock for your cart. Please try again.');
      }
      return;
    }

    setLoading(true);

    try {
      const orderId = generateOrderId();

      // Save order to file/database with order source
      const submitResult = await saveOrderToFile(orderId, orderType);
      const backendOrder = submitResult?.order || null;
      if (backendOrder) {
        setSubmittedOrder(backendOrder);
      }
      if (submitResult?.paymentOptions) {
        setPaymentOptions(submitResult.paymentOptions);
      }

      if (orderType === 'whatsapp') {
        // Generate WhatsApp message
        const whatsappMessage = formatOrderForWhatsApp(orderId);

        // Your business WhatsApp number (Rwanda format)
        // Replace with your actual WhatsApp number
        const businessWhatsApp = '250788305811'; // Example: Rwanda number

        // Open WhatsApp with pre-filled message
        const whatsappUrl = `https://wa.me/${businessWhatsApp}?text=${whatsappMessage}`;
        window.open(whatsappUrl, '_blank');

        // Clear cart
        setHasSubmittedOrder(true);
        clearCart();

        // Show success message
        alert(`Order ${orderId} placed successfully! A copy has been sent by email to ${supportEmail}. Please complete your order via WhatsApp.`);
      } else if (orderType === 'email') {
        // Email submission without WhatsApp
        setHasSubmittedOrder(true);
        clearCart();
        if (submitResult?.emailSent === false) {
          alert(`Order ${orderId} was created, but email could not be sent. Please check backend email settings and try again.`);
        } else {
          alert(`Order ${orderId} submitted via email successfully! We will contact you shortly. Notifications are sent to ${supportEmail}.`);
        }
      } else if (orderType === 'direct_no_email') {
        setHasSubmittedOrder(true);
        clearCart();
        alert(`Order ${orderId} submitted successfully without WhatsApp and without email. It will continue through normal confirmation workflow.`);
      } else {
        setHasSubmittedOrder(true);
        clearCart();
        alert(`Order ${orderId} submitted successfully! Notifications are sent to ${supportEmail}.`);
      }

    } catch (error) {
      console.error('Error submitting order:', error);
      if (error?.status === 409 && Array.isArray(error?.details) && error.details.length > 0) {
        const first = error.details[0];
        if (first.reason === 'insufficient_stock') {
          alert(`${first.productName || 'A product'} is out of stock or has insufficient quantity. Available: ${first.availableQty || 0}, requested: ${first.requestedQty || 0}.`);
        } else {
          alert(error.message || 'Some products are out of stock. Please update your cart and try again.');
        }
      } else {
        alert(error.message || 'Failed to submit order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal();
  const summaryImageFallback = 'https://placehold.co/160x160/f1f5f9/475569?text=No+Image';
  const getSummaryImageSrc = (item) => {
    const rawSrc = item?.selectedImage || item?.image;
    if (!rawSrc) return summaryImageFallback;
    const normalized = getFullImageUrl(rawSrc);
    return normalized || summaryImageFallback;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-7 text-black">Complete Your Order</h1>

          {submittedOrder && (
            <div className="mb-8 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-600" size={22} />
                <h2 className="text-xl font-bold text-green-900">Order Submitted Successfully</h2>
              </div>
              <p className="text-sm text-green-800 mb-4">
                Keep these payment details. Use them to complete your order.
              </p>

              <div className="rounded-xl bg-white border border-green-200 p-4 mb-4">
                <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Order Number</p>
                <p className="text-lg font-bold text-gray-900">#{submittedOrder.id}</p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
                <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <CreditCard size={16} /> Payment Numbers
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
                  <p><span className="font-semibold">BK:</span> {paymentOptions?.bank_bk_account || 'Not set'}</p>
                  <p><span className="font-semibold">Equity:</span> {paymentOptions?.bank_equity_account || 'Not set'}</p>
                  <p><span className="font-semibold">MTN Mobile Money:</span> {paymentOptions?.mobile_mtn_number || 'Not set'}</p>
                  <p><span className="font-semibold">Airtel Money:</span> {paymentOptions?.mobile_airtel_number || 'Not set'}</p>
                  <p><span className="font-semibold">TIN NUMBER:</span> {paymentOptions?.tin_number || 'Not set'}</p>
                  <p><span className="font-semibold">BPR PLC:</span> {paymentOptions?.ebm_number || 'Not set'}</p>
                </div>
                {paymentOptions?.notes && (
                  <p className="mt-2 text-xs text-blue-700">{paymentOptions.notes}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/my-account')}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Go to Complete Your Order
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/my-account')}
                  className="px-5 py-3 rounded-xl border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 transition"
                >
                  Complete Your Order
                </button>
              </div>
            </div>
          )}

          {!submittedOrder && <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Order Form */}
            <div className="lg:col-span-2">
              {/* Payment Methods Display */}
              <div className="bg-blue-50 rounded-lg border-2 border-blue-200 shadow-md p-4 sm:p-5 mb-4 sm:mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-blue-900">Payment Methods</h2>
                </div>
                <p className="text-sm text-blue-800 mb-4">
                  Complete payment using one of the methods below. Send your payment and upload proof in your order details.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {paymentOptions?.bank_bk_account && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-gray-700 mb-1">🏦 BK Account</p>
                      <p className="text-gray-900 font-mono">{paymentOptions.bank_bk_account}</p>
                    </div>
                  )}
                  {paymentOptions?.bank_equity_account && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-gray-700 mb-1">🏮 Equity Account</p>
                      <p className="text-gray-900 font-mono">{paymentOptions.bank_equity_account}</p>
                    </div>
                  )}
                  {paymentOptions?.mobile_mtn_number && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-gray-700 mb-1">📱 MTN Mobile Money</p>
                      <p className="text-gray-900 font-mono">{paymentOptions.mobile_mtn_number}</p>
                    </div>
                  )}
                  {paymentOptions?.mobile_airtel_number && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-gray-700 mb-1">📱 Airtel Money</p>
                      <p className="text-gray-900 font-mono">{paymentOptions.mobile_airtel_number}</p>
                    </div>
                  )}
                  {paymentOptions?.tin_number && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-gray-700 mb-1">🔢 TIN</p>
                      <p className="text-gray-900 font-mono">{paymentOptions.tin_number}</p>
                    </div>
                  )}
                  {paymentOptions?.ebm_number && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-gray-700 mb-1">🔢 EBM</p>
                      <p className="text-gray-900 font-mono">{paymentOptions.ebm_number}</p>
                    </div>
                  )}
                </div>
                {paymentOptions?.notes && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                    <p className="text-xs text-blue-700 font-semibold mb-1">📝 Additional Notes</p>
                    <p className="text-sm text-blue-800">{paymentOptions.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="customer_name"
                        value={orderData.customer_name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                      <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="customer_email"
                        value={orderData.customer_email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                      />
                      <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="customer_phone"
                        value={orderData.customer_phone}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., +250 788 000 000"
                      />
                      <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <div className="relative">
                      <textarea
                        name="delivery_address"
                        value={orderData.delivery_address}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your delivery address"
                      />
                      <MapPin className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Notes (Optional)
                    </label>
                    <div className="relative">
                      <textarea
                        name="notes"
                        value={orderData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special instructions..."
                      />
                      <FileText className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                  </div>



                  <div className="space-y-3">
                    <button
                      type="submit"
                      onClick={(e) => handleSubmitOrder(e, 'whatsapp')}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Phone size={20} />
                      {loading ? 'Processing...' : 'Complete Order via WhatsApp'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmitOrder(e, 'email')}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Mail size={20} />
                      {loading ? 'Processing...' : 'Submit Order via Email'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmitOrder(e, 'direct_no_email')}
                      disabled={loading}
                      className="w-full bg-slate-700 text-white py-2.5 rounded-lg hover:bg-slate-800 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FileText size={20} />
                      {loading ? 'Processing...' : 'Submit Order (No WhatsApp)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 lg:p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.cart_key || item.id} className="flex gap-3 pb-3 border-b border-gray-100">
                      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img
                          src={getSummaryImageSrc(item)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = summaryImageFallback;
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-semibold leading-snug">{item.name}</p>
                        {item.selected_size && <p className="text-xs text-indigo-600 font-semibold">Size: {item.selected_size}</p>}
                        {item.selected_color && <p className="text-xs text-purple-600 font-semibold">Color: {item.selected_color}</p>}
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm text-blue-600 font-bold">
                          RWF {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>Subtotal</span>
                    <span>RWF {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>Shipping</span>
                    <span className="text-amber-700 font-semibold">Negotiated with customer</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">RWF {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Option 1: WhatsApp Order</strong><br />
                      Send your order via WhatsApp for instant confirmation. An email copy is also sent.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Option 2: Submit Order via Email</strong><br />
                      Submit without WhatsApp and we will handle your order through email updates.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-800">
                      <strong>Option 3: Submit Order (No WhatsApp)</strong><br />
                      Submit directly without opening WhatsApp and without sending email. The order still follows normal confirmation workflow.
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Email Notifications</strong><br />
                      All order and payment-stage updates are sent to {supportEmail}.
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      <strong>Company Identifiers</strong><br />
                      TIN: {paymentOptions?.tin_number || 'Not set'}<br />
                      EBM: {paymentOptions?.ebm_number || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
