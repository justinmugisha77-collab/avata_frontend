import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const parseMoney = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || typeof value === 'undefined') return 0;
    const normalized = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getStock = (item) => {
    const stock = Number(item?.stock ?? 0);
    return Number.isFinite(stock) ? Math.max(0, stock) : 0;
  };

  const resolvePriceBySize = (item, sizeValue) => {
    // If a size is selected with a specific price, use that. Otherwise, use base product price.
    const options = Array.isArray(item?.size_options) ? item.size_options : [];
    const normalizedSize = sizeValue ? String(sizeValue).trim().toLowerCase() : '';
    if (normalizedSize) {
      const match = options.find((opt) => {
        const optVal = String(opt?.value ?? opt?.label ?? '').trim().toLowerCase();
        return optVal === normalizedSize;
      });
      const priced = parseMoney(match?.price);
      if (Number.isFinite(priced) && priced !== 0) return priced;
    }
    // No size selected or size has no price: use base product price
    const fallback = parseMoney(item?.price);
    return Number.isFinite(fallback) ? fallback : 0;
  };

  const resolvePriceByColor = (item, colorValue) => {
    const options = Array.isArray(item?.color_options) ? item.color_options : [];
    const normalizedColor = colorValue ? String(colorValue).trim().toLowerCase() : '';
    if (normalizedColor) {
      const match = options.find((opt) => {
        const optVal = String(opt?.value ?? opt?.label ?? '').trim().toLowerCase();
        return optVal === normalizedColor;
      });
      const priced = parseMoney(match?.price);
      if (Number.isFinite(priced) && priced !== 0) return priced;
    }
    const fallback = parseMoney(item?.price);
    return Number.isFinite(fallback) ? fallback : 0;
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      setCartCount(parsedCart.reduce((total, item) => total + item.quantity, 0));
    }
  }, []);

  // Sync cart across tabs/windows
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'cart') {
        try {
          const newCart = e.newValue ? JSON.parse(e.newValue) : [];
          setCart(newCart);
        } catch (err) {
          console.error('Failed to parse cart from storage event', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    console.debug('Cart updated:', cart, 'cartCount:', cartCount);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    // Normalize product and quantity
    const qty = Number(quantity) || 1;
    const selectedSize = product?.selected_size || product?.selectedSize || null;
    const selectedColor = product?.selected_color || product?.selectedColor || null;
    const cartKey = `${product.id}:${selectedSize || 'default'}:${selectedColor || 'default'}`;
    const colorPrice = resolvePriceByColor(product, selectedColor);
    const sizePrice = resolvePriceBySize(product, selectedSize);
    const resolvedPrice = colorPrice > 0 ? colorPrice : sizePrice;
    const normalized = {
      ...product,
      quantity: qty,
      price: resolvedPrice,
      selected_size: selectedSize,
      selected_color: selectedColor,
      cart_key: product?.cart_key || cartKey
    };
    const stock = getStock(normalized);

    if (stock <= 0) {
      return { success: false, message: `${normalized.name || 'This product'} is out of stock.` };
    }

    let result = { success: true, message: 'Added to cart' };
    setCart(prevCart => {
      const existingItem = prevCart.find(item => (item.cart_key || `${item.id}:${item.selected_size || 'default'}`) === normalized.cart_key);

      if (existingItem) {
        const nextQty = (Number(existingItem.quantity) || 0) + qty;
        const limit = getStock(existingItem);
        if (nextQty > limit) {
          result = { success: false, message: `Only ${limit} item(s) left in stock for ${existingItem.name || 'this product'}.` };
          return prevCart;
        }
        return prevCart.map(item =>
          (item.cart_key || `${item.id}:${item.selected_size || 'default'}`) === normalized.cart_key
            ? { ...item, ...normalized, quantity: nextQty }
            : item
        );
      } else {
        if (qty > stock) {
          result = { success: false, message: `Only ${stock} item(s) left in stock for ${normalized.name || 'this product'}.` };
          return prevCart;
        }
        return [...prevCart, normalized];
      }
    });
    console.debug('addToCart called for product:', normalized);
    return result;
  };

  const removeFromCart = (productIdOrCartKey) => {
    setCart(prevCart => prevCart.filter(item => {
      const key = item.cart_key || `${item.id}:${item.selected_size || 'default'}`;
      return key !== productIdOrCartKey && item.id !== productIdOrCartKey;
    }));
  };

  const updateQuantity = (productIdOrCartKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productIdOrCartKey);
      return { success: true, message: 'Item removed from cart' };
    }

    let result = { success: true, message: 'Quantity updated' };
    setCart(prevCart =>
      prevCart.map(item => {
        const key = item.cart_key || `${item.id}:${item.selected_size || 'default'}`;
        if (key !== productIdOrCartKey && item.id !== productIdOrCartKey) return item;
        const stock = getStock(item);
        if (quantity > stock) {
          result = { success: false, message: `Only ${stock} item(s) available for ${item.name || 'this product'}.` };
          return item;
        }
        return { ...item, quantity };
      })
    );
    return result;
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateItemSize = (productIdOrCartKey, newSize) => {
    let result = { success: true, message: 'Size updated' };
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => {
        const key = item.cart_key || `${item.id}:${item.selected_size || 'default'}:${item.selected_color || 'default'}`;
        return key === productIdOrCartKey || item.id === productIdOrCartKey;
      });

      if (itemIndex === -1) {
        result = { success: false, message: 'Item not found in cart' };
        return prevCart;
      }

      const currentItem = prevCart[itemIndex];
      const normalizedSize = newSize || null;
      const normalizedColor = currentItem.selected_color || null;
      const newCartKey = `${currentItem.id}:${normalizedSize || 'default'}:${normalizedColor || 'default'}`;
      const colorPrice = resolvePriceByColor(currentItem, normalizedColor);
      const sizePrice = resolvePriceBySize(currentItem, normalizedSize);
      const updatedPrice = colorPrice > 0 ? colorPrice : sizePrice;
      const stockLimit = getStock(currentItem);
      
      // Check if an item with the new size/color already exists
      const existingItemWithNewSize = prevCart.findIndex(item => 
        (item.cart_key || `${item.id}:${item.selected_size || 'default'}:${item.selected_color || 'default'}`) === newCartKey
      );

      if (existingItemWithNewSize !== -1 && existingItemWithNewSize !== itemIndex) {
        const existingTargetItem = prevCart[existingItemWithNewSize];
        const mergedQty = Number(existingTargetItem.quantity || 0) + Number(currentItem.quantity || 0);
        if (mergedQty > stockLimit) {
          result = { success: false, message: `Only ${stockLimit} item(s) left in stock for ${currentItem.name || 'this product'}.` };
          return prevCart;
        }
        result = { success: true, message: 'Size updated and quantities merged' };
        const merged = prevCart.map((item, idx) => {
          if (idx === existingItemWithNewSize) {
            return { ...item, quantity: mergedQty, selected_size: normalizedSize, cart_key: newCartKey, price: updatedPrice };
          }
          return item;
        }).filter((_, idx) => idx !== itemIndex);
        return merged;
      }

      const updated = [...prevCart];
      updated[itemIndex] = {
        ...currentItem,
        selected_size: normalizedSize,
        cart_key: newCartKey,
        price: updatedPrice
      };
      return updated;
    });
    return result;
  };

  const updateItemColor = (productIdOrCartKey, newColor) => {
    let result = { success: true, message: 'Color updated' };
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => {
        const key = item.cart_key || `${item.id}:${item.selected_size || 'default'}:${item.selected_color || 'default'}`;
        return key === productIdOrCartKey || item.id === productIdOrCartKey;
      });

      if (itemIndex === -1) {
        result = { success: false, message: 'Item not found in cart' };
        return prevCart;
      }

      const currentItem = prevCart[itemIndex];
      const normalizedColor = newColor || null;
      const normalizedSize = currentItem.selected_size || null;
      const newCartKey = `${currentItem.id}:${normalizedSize || 'default'}:${normalizedColor || 'default'}`;
      const colorPrice = resolvePriceByColor(currentItem, normalizedColor);
      const sizePrice = resolvePriceBySize(currentItem, normalizedSize);
      const updatedPrice = colorPrice > 0 ? colorPrice : sizePrice;
      const stockLimit = getStock(currentItem);

      const existingItemWithNewColor = prevCart.findIndex(item => 
        (item.cart_key || `${item.id}:${item.selected_size || 'default'}:${item.selected_color || 'default'}`) === newCartKey
      );

      if (existingItemWithNewColor !== -1 && existingItemWithNewColor !== itemIndex) {
        const existingTargetItem = prevCart[existingItemWithNewColor];
        const mergedQty = Number(existingTargetItem.quantity || 0) + Number(currentItem.quantity || 0);
        if (mergedQty > stockLimit) {
          result = { success: false, message: `Only ${stockLimit} item(s) left in stock for ${currentItem.name || 'this product'}.` };
          return prevCart;
        }
        result = { success: true, message: 'Color updated and quantities merged' };
        const merged = prevCart.map((item, idx) => {
          if (idx === existingItemWithNewColor) {
            return { ...item, quantity: mergedQty, selected_color: normalizedColor, cart_key: newCartKey, price: updatedPrice };
          }
          return item;
        }).filter((_, idx) => idx !== itemIndex);
        return merged;
      }

      const updated = [...prevCart];
      updated[itemIndex] = {
        ...currentItem,
        selected_color: normalizedColor,
        cart_key: newCartKey,
        price: updatedPrice
      };
      return updated;
    });
    return result;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  };

  const value = {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemSize,
    updateItemColor,
    clearCart,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
