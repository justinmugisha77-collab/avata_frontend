import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginRegisterModal from '../components/LoginRegisterModal';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import getFullImageUrl from '../utils/getFullImageUrl';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated, saveRedirectPath } = useAuth();
  const { cart, removeFromCart, updateQuantity, updateItemSize, updateItemColor } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Always use the shared CartContext so added items appear immediately
  const cartItems = cart || [];
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    console.debug('Cart page loaded. Cart items:', cartItems);
  }, [cartItems]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const result = updateQuantity(productId, newQuantity);
    if (result && result.success === false) {
      alert(result.message || 'Requested quantity exceeds available stock.');
    }
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const incrementQuantity = (productId, currentQuantity) => {
    handleQuantityChange(productId, currentQuantity + 1);
  };

  const decrementQuantity = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      handleQuantityChange(productId, currentQuantity - 1);
    }
  };

  const handleQuantityInput = (productId, value) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0) {
      handleQuantityChange(productId, quantity);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const validateCartStock = async () => {
    const checks = await Promise.all(cartItems.map(async (item) => {
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

  const handleCheckout = async () => {
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

    if (!isAuthenticated) {
      saveRedirectPath('/payment');
      setShowLoginModal(true);
      return;
    }
    navigate('/payment');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-4">
            <ShoppingCart className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              Add some products to your cart to get started!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LoginRegisterModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <main className="flex-grow bg-gray-50 py-4 sm:py-6">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-xl sm:text-2xl font-bold">Your Shopping Cart</h2>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-semibold"
                >
                  ← Back to Home
                </button>
              </div>
              {!isAuthenticated && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  You can add items without login. Login is required only when you click Proceed to Checkout.
                </div>
              )}
              
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.cart_key || item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                      <div className="w-full h-full rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
                        <img
                          src={getFullImageUrl(item.selectedImage || item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{item.name}</h3>
                      {item.category && (
                        <p className="text-sm text-gray-500">{item.category}</p>
                      )}
                      {/* Size selector - show if item has size_options */}
                      {Array.isArray(item.size_options) && item.size_options.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-600">Size:</label>
                          <select
                            value={item.selected_size || ''}
                            onChange={(e) => {
                              const result = updateItemSize(item.cart_key || item.id, e.target.value || null);
                              if (!result?.success) {
                                alert(result?.message || 'Could not update size');
                              }
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select size</option>
                            {item.size_options.map((opt, idx) => (
                              <option key={idx} value={opt.value || opt.label}>
                                {opt.value || opt.label}
                              </option>
                            ))}
                          </select>
                          {item.selected_size && (
                            <span className="text-xs font-semibold text-indigo-600">✓ {item.selected_size}</span>
                          )}
                        </div>
                      )}
                      {Array.isArray(item.color_options) && item.color_options.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-600">Color:</label>
                          <select
                            value={item.selected_color || ''}
                            onChange={(e) => {
                              const result = updateItemColor(item.cart_key || item.id, e.target.value || null);
                              if (!result?.success) {
                                alert(result?.message || 'Could not update color');
                              }
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select color</option>
                            {item.color_options.map((opt, idx) => (
                              <option key={idx} value={opt.value || opt.label}>
                                {opt.value || opt.label}
                              </option>
                            ))}
                          </select>
                          {item.selected_color && (
                            <span className="text-xs font-semibold text-purple-600">✓ {item.selected_color}</span>
                          )}
                        </div>
                      )}
                      {item.selected_size && (!Array.isArray(item.size_options) || item.size_options.length === 0) && (
                        <p className="text-sm text-indigo-600 font-semibold mt-1">Size: {item.selected_size}</p>
                      )}
                      {item.selected_color && (!Array.isArray(item.color_options) || item.color_options.length === 0) && (
                        <p className="text-sm text-purple-600 font-semibold mt-1">Color: {item.selected_color}</p>
                      )}
                      {Number(item.stock ?? 0) <= 0 && (
                        <p className="text-sm font-semibold text-red-600 mt-1">Out of stock</p>
                      )}
                      {Number(item.stock ?? 0) > 0 && Number(item.quantity || 0) > Number(item.stock || 0) && (
                        <p className="text-sm font-semibold text-amber-600 mt-1">Only {Number(item.stock || 0)} left in stock</p>
                      )}
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        RWF {(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementQuantity(item.cart_key || item.id, item.quantity)}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInput(item.cart_key || item.id, e.target.value)}
                        className="w-14 sm:w-16 text-center py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button
                        onClick={() => incrementQuantity(item.cart_key || item.id, item.quantity)}
                        disabled={Number(item.quantity || 0) >= Number(item.stock || 0)}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right w-full sm:w-auto">
                      <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                        RWF {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.cart_key || item.id)}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 transition text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Cart Summary */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold">Total:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    RWF {calculateTotal().toLocaleString()}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/products')}
                    className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
