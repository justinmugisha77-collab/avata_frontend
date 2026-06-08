import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, ZoomIn, ZoomOut } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductReview from '../components/ProductReview';
import RelatedProducts from '../components/RelatedProducts';
import { useCart } from '../contexts/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [categories, setCategories] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const visitorKey = React.useMemo(() => {
    const keyName = 'productVisitorKey';
    const existing = localStorage.getItem(keyName);
    if (existing) return existing;
    const generated = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(keyName, generated);
    return generated;
  }, []);

  const parseMoney = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || typeof value === 'undefined') return 0;
    const normalized = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const mediaItems = React.useMemo(() => {
    if (!product) return [];
    const fallbackImages = product.images || (product.image ? [product.image] : []);
    return (Array.isArray(product.media) && product.media.length > 0)
      ? product.media
      : fallbackImages.map((url) => ({ type: 'image', url }));
  }, [product]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleWheelZoom = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) setZoom(prev => Math.min(prev + 0.1, 4));
    else setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  useEffect(() => {
    // Fetch product details from API
    fetch(`http://localhost:5000/api/products/${id}`)
      .then(response => response.json())
      .then(data => {
        // Process image URLs to ensure they have the full path
        const processedData = {
          ...data,
          media: Array.isArray(data.media)
            ? data.media.map((item) => {
                if (typeof item === 'string') {
                  const lower = item.toLowerCase();
                  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv');
                  const url = item.startsWith('http') ? item : `http://localhost:5000${item}`;
                  return { type: isVideo ? 'video' : 'image', url };
                }
                return {
                  type: item?.type === 'video' ? 'video' : 'image',
                  url: (item?.url || '').startsWith('http') ? item.url : `http://localhost:5000${item?.url || ''}`
                };
              })
            : [],
          images: data.images && data.images.length > 0
            ? data.images.map(img => img.startsWith('http') ? img : `http://localhost:5000${img}`)
            : data.image
              ? [data.image.startsWith('http') ? data.image : `http://localhost:5000${data.image}`]
              : []
        };
        setProduct(processedData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then((response) => response.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/api/products/${id}/likes`, {
      headers: { 'x-visitor-key': visitorKey }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.success) {
          setLikesCount(Number(data.likes_count || 0));
          setLiked(Boolean(data.liked));
        }
      })
      .catch((error) => {
        console.error('Error loading product likes:', error);
      });
  }, [id, visitorKey]);

  const currentCategoryName = product?.category || product?.category_name || '';
  const currentCategoryId = Number(product?.category_id || 0);
  const currentSubcategoryId = Number(product?.subcategory_id || 0);

  const currentCategory = categories.find((cat) => Number(cat.id) === currentCategoryId) || null;
  const childSubcategories = React.useMemo(() => {
    if (!currentCategory) return [];
    return categories.filter((cat) => Number(cat.parent_id) === Number(currentCategory.id));
  }, [categories, currentCategory]);

  const siblingCategories = React.useMemo(() => {
    if (!currentCategory) return [];
    const parentId = Number(currentCategory.parent_id || 0);
    if (parentId > 0) {
      return categories.filter((cat) => Number(cat.parent_id) === parentId);
    }
    return categories.filter((cat) => !cat.parent_id);
  }, [categories, currentCategory]);

  const handleToggleLike = async () => {
    if (!id || likeLoading) return;
    setLikeLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}/likes/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_key: visitorKey })
      });
      const data = await response.json();
      if (response.ok && data?.success) {
        setLiked(Boolean(data.liked));
        setLikesCount(Number(data.likes_count || 0));
      }
    } catch (error) {
      console.error('Error toggling product like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handlePreviousImage = () => {
    if (mediaItems.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? mediaItems.length - 1 : prev - 1
      );
      setRotation(0);
      setZoom(1);
    }
  };

  const handleNextImage = () => {
    if (mediaItems.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === mediaItems.length - 1 ? 0 : prev + 1
      );
      setRotation(0);
      setZoom(1);
    }
  };

  const handleRotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert(`${product.name} is out of stock.`);
      return;
    }
    if (quantity > availableStock) {
      alert(`Only ${availableStock} item(s) left in stock.`);
      return;
    }
    
    // Check if color is required but not selected
    const parsedColorOptions = Array.isArray(product?.color_options) ? product.color_options : [];
    if (parsedColorOptions.length > 0 && !selectedColor) {
      alert('Please select a color before adding to cart.');
      return;
    }
    
    // Check if size is required but not selected
    const parsedSizeOptions = Array.isArray(product?.size_options) ? product.size_options : [];
    if (parsedSizeOptions.length > 0 && !selectedSize) {
      alert('Please select a size before adding to cart.');
      return;
    }
    
    const selectedOption = parsedSizeOptions.find((opt) => String(opt.value || opt.label) === String(selectedSize));
    const selectedColorOption = parsedColorOptions.find((opt) => String(opt.value || opt.label) === String(selectedColor));
    const optionPrice = parseMoney(selectedOption?.price);
    const colorPrice = parseMoney(selectedColorOption?.price);
    const basePrice = parseMoney(product?.price);
    const selectedPrice = colorPrice > 0 ? colorPrice : (optionPrice > 0 ? optionPrice : basePrice);

    // Use CartContext addToCart for consistent cart updates
    const cartItem = {
      ...product,
      quantity: quantity,
      selectedImage: currentMedia?.url || product.images?.[currentImageIndex] || product.image,
      selected_size: selectedSize || null,
      selected_color: selectedColor || null,
      price: selectedPrice
    };
    const result = addToCart(cartItem, quantity);
    if (!result?.success) {
      alert(result?.message || 'Could not add item to cart.');
      return;
    }
    alert('Product added to cart!');
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, availableStock));
  };

  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleQuantityInput = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(Math.min(value, availableStock));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-grow flex items-center justify-center py-24">
          <div className="text-lg font-semibold text-slate-600">Loading product…</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Go Back Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fallbackImages = product.images || (product.image ? [product.image] : []);
  const currentMedia = mediaItems[currentImageIndex] || null;
  const currentImage = currentMedia?.url || fallbackImages[currentImageIndex] || product.image;
  const availableStock = Number(product?.stock ?? 0);
  const isOutOfStock = !Number.isFinite(availableStock) || availableStock <= 0;
  const parsedColorOptions = Array.isArray(product?.color_options) ? product.color_options : [];
  const parsedSizeOptions = Array.isArray(product?.size_options) ? product.size_options : [];
  const selectedOption = parsedSizeOptions.find((opt) => String(opt.value || opt.label) === String(selectedSize));
  const selectedColorOption = parsedColorOptions.find((opt) => String(opt.value || opt.label) === String(selectedColor));
  const optionPrice = parseMoney(selectedOption?.price);
  const colorPrice = parseMoney(selectedColorOption?.price);
  const basePrice = parseMoney(product?.price);
  const activePrice = colorPrice > 0 ? colorPrice : (Number.isFinite(optionPrice) && optionPrice !== 0 ? optionPrice : basePrice);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80">
      <Header />

      <main className="flex-grow pb-8 sm:pb-10 pt-2 sm:pt-4 md:pt-5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb — compact so the product image stays above the fold */}
          <nav className="mb-2 sm:mb-3 text-xs sm:text-sm text-slate-600" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigate('/')} className="text-blue-600 hover:underline font-medium">
              Home
            </button>
            <span className="mx-2 text-slate-400">/</span>
            <button
              type="button"
              onClick={() => navigate(`/products?category=${encodeURIComponent(product.category || product.category_name || '')}`)}
              className="text-blue-600 hover:underline font-medium"
            >
              {product.category || product.category_name}
            </button>
            {product.subcategory && (
              <>
                <span className="mx-2 text-slate-400">/</span>
                <button
                  type="button"
                  onClick={() => navigate(`/products?subcategory=${encodeURIComponent(product.subcategory)}`)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {product.subcategory}
                </button>
              </>
            )}
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-800 font-medium line-clamp-1">{product.name}</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80 p-3 sm:p-5 md:p-6 lg:p-8">
            {/* Mobile Thumbnail Gallery (horizontal scroll) */}
            {mediaItems.length > 1 && (
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-3 pt-1 mb-4">
                {mediaItems.map((media, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setRotation(0);
                    }}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition ${index === currentImageIndex ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {media.type === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img
                        src={media.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '1 / 1' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className={`grid grid-cols-1 ${mediaItems.length > 1 ? 'lg:grid-cols-[80px_1fr_minmax(0,380px)]' : 'lg:grid-cols-[1fr_minmax(0,380px)]'} gap-4 sm:gap-6 lg:gap-8 xl:gap-10 items-start`}>
              {/* Thumbnail Gallery - Left Column (only on lg+) */}
              {mediaItems.length > 1 && (
                <div className="hidden lg:flex flex-col gap-2 overflow-y-auto max-h-[32rem] sticky top-20 z-10">
                  {mediaItems.map((media, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setRotation(0);
                      }}
                      className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition ${index === currentImageIndex ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      {media.type === 'video' ? (
                        <video src={media.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img
                          src={media.url}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          style={{ aspectRatio: '1 / 1' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Image first — tall viewport-based frame so shoppers see the photo before scrolling */}
              <div className="space-y-2 sm:space-y-3 w-full lg:sticky lg:top-20 lg:z-10 self-start">
                <div
                  className={`relative w-full mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200/90 shadow-md ring-1 ring-slate-900/[0.04] ${mediaItems.length > 1 ? 'h-[min(20rem,calc(100svh-11.5rem))] sm:h-[min(24rem,calc(100svh-12rem))] md:h-[min(26rem,calc(100svh-12.5rem))] lg:h-[min(28rem,calc(100svh-13rem))] xl:h-[min(32rem,calc(100svh-13.5rem))]' : 'h-[min(24rem,calc(100svh-10.5rem))] sm:h-[min(30rem,calc(100svh-11rem))] md:h-[min(36rem,calc(100svh-11.5rem))] lg:h-[min(40rem,calc(100svh-13rem))] xl:h-[min(45rem,calc(100svh-13.5rem))]'} min-h-[200px]`}
                  onWheel={handleWheelZoom}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 overflow-hidden p-2 sm:p-3">
                    {currentMedia?.type === 'video' ? (
                      <video
                        src={currentMedia.url}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'center center' }}
                      />
                    )}
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <span className="bg-red-600 text-white text-sm sm:text-base font-bold px-4 py-2 rounded-md tracking-wide">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}

                  {/* Image Navigation Arrows */}
                  {mediaItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePreviousImage}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-2 shadow-lg border border-slate-200/80"
                      >
                        <ChevronLeft size={22} className="text-slate-800" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-2 shadow-lg border border-slate-200/80"
                      >
                        <ChevronRight size={22} className="text-slate-800" />
                      </button>
                    </>
                  )}

                  {/* Zoom Level indicator */}
                  {zoom !== 1 && (
                    <div className="absolute top-1.5 left-1.5 bg-black bg-opacity-60 text-white text-[10px] px-1.5 py-0.5 rounded-full pointer-events-none">
                      {Math.round(zoom * 100)}%
                    </div>
                  )}

                  {/* Zoom + Rotate Controls */}
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      title="Zoom out"
                      className="bg-white/95 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md border border-slate-200/80 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 hover:text-blue-600"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoom >= 4}
                      title="Zoom in"
                      className="bg-white/95 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md border border-slate-200/80 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 hover:text-blue-600"
                    >
                      <ZoomIn size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRotateImage}
                      className="bg-white/95 hover:bg-white rounded-lg px-2.5 text-xs font-semibold shadow-md border border-slate-200/80 h-9 flex items-center text-slate-700 hover:text-blue-600"
                    >
                      ↻ Rotate
                    </button>
                  </div>

                  {/* Image Counter */}
                  {mediaItems.length > 1 && (
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-1.5 py-0.5 rounded text-[10px]">
                      {currentImageIndex + 1} / {mediaItems.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info Section */}
              <div className="space-y-4 sm:space-y-5 min-w-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight tracking-tight">{product.name}</h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    <span className="font-semibold text-slate-800">Category:</span> {product.category}
                    {product.subcategory && (
                      <span className="ml-2 text-gray-400">/ {product.subcategory}</span>
                    )}
                  </p>
                </div>

                {/* Price */}
                <div className="border-y border-slate-100 py-4">
                  <div className="flex flex-wrap items-baseline gap-3">
                    {product.originalPrice && product.originalPrice > product.price ? (
                      <>
                        <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                          {product.price.toLocaleString()} RWF
                        </span>
                        <span className="text-lg sm:text-xl text-slate-400 line-through">
                          {product.originalPrice.toLocaleString()} RWF
                        </span>
                        <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-sm font-bold">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} %
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                        {activePrice.toLocaleString()} <span className="text-lg sm:text-xl font-semibold text-slate-600">RWF</span>
                      </span>
                    )}
                  </div>
                </div>

                {parsedColorOptions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base mb-1">Color</h3>
                    <p className="text-sm text-slate-600 mb-2">Select one color for this product.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {parsedColorOptions.map((option, index) => {
                        const value = String(option.value || option.label || `color-${index}`);
                        const optPrice = parseMoney(option.price);
                        const hasPrice = Number.isFinite(optPrice) && optPrice !== 0;
                        const delta = hasPrice ? optPrice - basePrice : 0;
                        const deltaText = delta === 0 ? '' : `${delta > 0 ? '+' : '-'}RWF ${Math.abs(delta).toLocaleString()}`;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSelectedColor(value)}
                            className={`border rounded-lg px-3 py-2 text-sm font-semibold transition flex flex-col items-start gap-1 ${selectedColor === value ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 text-slate-700 hover:border-blue-300 bg-white'}`}
                          >
                            <div className="flex items-center gap-2">
                              {option.hex_code && (
                                <div
                                  className="w-4 h-4 rounded-full border border-slate-300"
                                  style={{ backgroundColor: option.hex_code }}
                                  title={value}
                                />
                              )}
                              <span>{value}</span>
                            </div>
                            {hasPrice && (
                              <span className="text-xs text-slate-500">
                                RWF {optPrice.toLocaleString()}{deltaText ? ` (${deltaText})` : ''}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!selectedColor && <p className="text-xs text-red-600 mt-2">Choose a color before adding to cart.</p>}
                    {selectedColor && selectedColorOption && colorPrice > 0 && (
                      <div className="mt-2 text-sm text-slate-700">
                        <span className="font-medium">Selected color price:</span> RWF {colorPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {parsedSizeOptions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base mb-1">Size</h3>
                    <p className="text-sm text-slate-600 mb-2">Select one size for this product.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {parsedSizeOptions.map((option, index) => {
                        const value = String(option.value || option.label || `size-${index}`);
                        const optPrice = parseMoney(option.price);
                        const hasPrice = Number.isFinite(optPrice) && optPrice !== 0;
                        const delta = hasPrice ? optPrice - basePrice : 0;
                        const deltaText = `${delta >= 0 ? '+' : '-'}RWF ${Math.abs(delta).toLocaleString()}`;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSelectedSize(value)}
                            className={`border rounded-lg px-2 py-2 text-sm font-semibold transition ${selectedSize === value ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 text-slate-700 hover:border-blue-300 bg-white'}`}
                          >
                            {value}
                            {hasPrice && ` - RWF ${Number(optPrice).toLocaleString()}`}
                            {hasPrice && ` (${deltaText})`}
                          </button>
                        );
                      })}
                    </div>
                    {!selectedSize && <p className="text-xs text-red-600 mt-2">Choose a size before adding to cart.</p>}
                    {selectedSize && (
                      <div className="mt-1.5 text-xs sm:text-sm text-gray-700">
                        <span className="font-medium">Selected price:</span> <span className="font-semibold">RWF {activePrice.toLocaleString()}</span>
                        {Number.isFinite(optionPrice) && optionPrice !== 0 && (
                          <span className="ml-2 text-sm text-gray-500">(difference: {optionPrice - basePrice >= 0 ? '+' : '-'}RWF {Math.abs(optionPrice - basePrice).toLocaleString()})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base mb-2">Description</h3>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-prose">{product.description}</p>
                  </div>
                )}

                {/* Specifications */}
                {product.specifications && (
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base mb-2">Specifications</h3>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <h3 className="font-semibold text-slate-900 text-base mb-2">Quantity</h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={decrementQuantity}
                      disabled={isOutOfStock}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-lg font-bold text-slate-700 disabled:opacity-40"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleQuantityInput}
                      min="1"
                      max={Math.max(1, availableStock)}
                      disabled={isOutOfStock}
                      className="w-16 h-10 text-center border border-slate-200 rounded-lg text-base font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={incrementQuantity}
                      disabled={isOutOfStock || quantity >= availableStock}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-lg font-bold text-slate-700 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || (parsedColorOptions.length > 0 && !selectedColor) || (parsedSizeOptions.length > 0 && !selectedSize)}
                    className={`w-full sm:flex-1 px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 text-base font-bold shadow-md transition ${isOutOfStock ? 'bg-slate-300 text-white cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'}`}
                  >
                    <ShoppingCart size={22} />
                    {isOutOfStock ? 'Out of stock' : (parsedColorOptions.length > 0 && !selectedColor ? 'Select a color first' : (parsedSizeOptions.length > 0 && !selectedSize ? 'Select a size first' : 'Add to cart'))}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    disabled={likeLoading}
                    className={`w-full sm:w-auto sm:min-w-[7rem] min-h-[3.25rem] border-2 rounded-xl flex items-center justify-center gap-2 px-4 transition font-semibold ${liked ? 'border-red-500 text-red-600 bg-red-50' : 'border-slate-200 bg-white hover:border-red-400 hover:text-red-600'} ${likeLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <Heart size={22} className={liked ? 'fill-red-600 text-red-600' : ''} />
                    <span className="text-base">{likesCount}</span>
                  </button>
                </div>

                {/* Stock Status */}
                {isOutOfStock ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-sm leading-relaxed text-red-700">
                      <span className="font-semibold">Out of Stock</span> - This product is currently unavailable.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-sm leading-relaxed text-green-800">
                      <span className="font-semibold">In Stock</span> - {availableStock} item(s) available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Browse links — below hero so the product image stays at the top of the page */}
            {siblingCategories.length > 0 && (
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Same category</p>
                <div className="flex flex-wrap gap-2">
                  {siblingCategories.map((cat) => {
                    const isCurrent = Number(cat.id) === currentCategoryId;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => navigate(`/products?categoryId=${encodeURIComponent(cat.id)}`)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${isCurrent ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {childSubcategories.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Subcategories</p>
                <div className="flex flex-wrap gap-2">
                  {childSubcategories.map((subcat) => {
                    const isCurrentSubcategory = Number(subcat.id) === currentSubcategoryId;
                    return (
                      <button
                        type="button"
                        key={subcat.id}
                        onClick={() => navigate(`/products?categoryId=${encodeURIComponent(subcat.id)}`)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${isCurrentSubcategory ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'}`}
                      >
                        {subcat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Related Products */}
            <div className="mt-10 sm:mt-12 md:mt-14">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-3">You may also like</h3>
              <RelatedProducts
                currentProductId={id}
                currentCategoryId={currentCategoryId}
                currentSubcategoryId={currentSubcategoryId}
                currentCategoryName={currentCategoryName}
              />
          </div>

          {/* Product Reviews Section */}
          <div className="mt-10 sm:mt-12 rounded-2xl bg-white border border-slate-200/80 shadow-md p-4 sm:p-6 md:p-8">
            <ProductReview productId={id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
