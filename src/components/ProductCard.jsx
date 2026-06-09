import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getFullImageUrl from '../utils/getFullImageUrl';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ShoppingCart, ZoomIn, ZoomOut } from 'lucide-react';
import { SUPPORT_EMAIL, buildGmailComposeUrl } from '../utils/supportContact';

const ProductCard = ({ product, size = 'normal' }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [zoom, setZoom] = useState(1);
    const [showZoomControls, setShowZoomControls] = useState(false);
    const imageContainerRef = useRef(null);

    const businessWhatsApp = '250788305811';
    const supportEmail = SUPPORT_EMAIL;


    const handleProductClick = () => {
        navigate(`/product/${product.id}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        if (isOutOfStock) {
            alert(`${product.name} is out of stock.`);
            return;
        }
        if (Array.isArray(product.size_options) && product.size_options.length > 0) {
            navigate(`/product/${product.id}`);
            return;
        }
        // Allow adding to cart without login - authentication required when viewing cart
        const result = addToCart(product);
        if (!result?.success) {
            alert(result?.message || `${product.name} cannot be added to cart right now.`);
            return;
        }
        alert(`Added ${product.name} to Cart. Go to cart to continue.`);
    };

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setZoom(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setZoom(prev => Math.max(prev - 0.5, 1));
    };

    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            setZoom(prev => Math.min(prev + 0.25, 3));
        } else {
            setZoom(prev => Math.max(prev - 0.25, 1));
        }
    };

    // Attach wheel event listener with { passive: false } to allow preventDefault
    useEffect(() => {
        const container = imageContainerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);


    // Determine media
    let imagesArr = [];
    if (product.images) {
        imagesArr = Array.isArray(product.images) ? product.images : String(product.images).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!imagesArr.length && product.image) imagesArr = [product.image];
    const firstImg = imagesArr[0] || '';

    const mediaArr = Array.isArray(product.media)
        ? product.media
        : imagesArr.map((url) => ({ type: 'image', url }));
    const firstMedia = mediaArr[0] || null;
    const firstMediaUrl = firstMedia?.url || firstImg;
    const firstMediaType = firstMedia?.type || 'image';

    const fallbackImage = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80';
    const displayImage = firstMediaUrl ? getFullImageUrl(firstMediaUrl) : fallbackImage;

    // If product has size options with prices, show a min-max range
    const sizeOpts = Array.isArray(product?.size_options) ? product.size_options : [];
    const baseP = Number(product?.price || 0);
    const resolvedPrices = [baseP].concat(sizeOpts.map((o) => Number(o?.price || 0)).filter((p) => Number.isFinite(p) && p !== 0));
    const minP = Math.min(...resolvedPrices);
    const maxP = Math.max(...resolvedPrices);
    const priceDisplay = (minP === maxP)
        ? `RWF ${Number(minP).toLocaleString()}`
        : `RWF ${Number(minP).toLocaleString()} - RWF ${Number(maxP).toLocaleString()}`;
    const stock = Number(product?.stock ?? 0);
    const isOutOfStock = !Number.isFinite(stock) || stock <= 0;
    const quantityInStock = Number.isFinite(stock) && stock > 0 ? stock : 0;
    const sizeOptions = Array.isArray(product?.size_options) ? product.size_options : [];
    const sizeLabels = sizeOptions.map((opt) => String(opt?.value || opt?.label || '').trim()).filter(Boolean);

    const categoriesList = product.categories && product.categories.length
        ? product.categories.join(', ')
        : (product.category || 'N/A');

    const productUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.id}`;

    const whatsappMessage = encodeURIComponent(
        `Hello, I'm interested in ${product.name || 'this product'} (ID: ${product.id || 'N/A'})\n` +
        `Categories: ${categoriesList}\n` +
        `${product.price ? `Price: ${priceDisplay}\n` : ''}` +
        `Quantity in Stock: ${quantityInStock}\n` +
        `Link: ${productUrl}\n` +
        `Image: ${displayImage}\n\n` +
        `Please reply with availability, lead time and shipping options. Thank you.`
    );

    const emailSubject = encodeURIComponent(`Inquiry about ${product.name}`);
    const emailBody = encodeURIComponent(
        `Hello,\n\nI would like to inquire about the following product:\n\n` +
        `Product Name: ${product.name}\n` +
        `Product ID: ${product.id || 'N/A'}\n` +
        `Categories: ${categoriesList}\n` +
        `Price: ${priceDisplay}\n` +
        `Quantity in Stock: ${quantityInStock}\n` +
        `Product Link: ${productUrl}\n` +
        `Image: ${displayImage}\n\n` +
        `Please reply with availability, lead time, minimum order and shipping options.\n\nThank you.`
    );

    const gmailComposeUrl = buildGmailComposeUrl({
        to: supportEmail,
        subject: `Inquiry about ${product.name}`,
        body:
            `Hello,\n\nI would like to inquire about the following product:\n\n` +
            `Product Name: ${product.name}\n` +
            `Product ID: ${product.id || 'N/A'}\n` +
            `Categories: ${categoriesList}\n` +
            `Price: ${priceDisplay}\n` +
            `Quantity in Stock: ${quantityInStock}\n` +
            `Product Link: ${productUrl}\n` +
            `Image: ${displayImage}\n\n` +
            `Please reply with availability, lead time, minimum order and shipping options.\n\nThank you.`
    });

    const isSmall = size === 'small';
    const NEW_THRESHOLD_DAYS = 14;
    const isNewItem = (() => {
        const created = product?.created_at || product?.createdAt || null;
        if (!created) return false;
        const createdDate = new Date(created);
        if (Number.isNaN(createdDate.getTime())) return false;
        const diffMs = Date.now() - createdDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= NEW_THRESHOLD_DAYS;
    })();

    return (
        <div
            onClick={handleProductClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleProductClick(); }}
            className={`cursor-pointer bg-white rounded-xl overflow-hidden border ${isSmall ? 'border-gray-100 shadow-sm' : 'border-gray-100 shadow-md hover:shadow-xl'} transition-shadow flex flex-col h-full group relative ${isSmall ? 'text-sm' : ''}`}
        >
            {/* Image Area */}
            <div
                ref={imageContainerRef}
                className={`relative w-full ${isSmall ? 'aspect-[4/3] p-2' : 'aspect-[4/3] p-3'} bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center overflow-hidden cursor-pointer`}
                tabIndex={0}
                aria-label={product.name}
                onMouseEnter={() => setShowZoomControls(true)}
                onMouseLeave={() => { setShowZoomControls(false); setZoom(1); }}
            >
                {firstMediaType === 'video' ? (
                    <video
                        src={displayImage}
                        onClick={handleProductClick}
                        className="w-full h-full object-contain transition-transform duration-300 drop-shadow-md"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                    />
                ) : (
                    <img
                        src={displayImage}
                        alt={product.name}
                        onClick={handleProductClick}
                        className="w-full h-full object-contain transition-transform duration-300 drop-shadow-md"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    />
                )}

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <span className={`${isSmall ? 'bg-red-600 text-white text-xs px-3 py-1 rounded-md' : 'bg-red-600 text-white text-sm sm:text-base font-bold px-4 py-2 rounded-md tracking-wide'}`}>
                            OUT OF STOCK
                        </span>
                    </div>
                )}

                {isNewItem && (
                    <div className="absolute top-3 left-3 z-20">
                        <span className={`${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} bg-yellow-100 text-yellow-800 font-bold rounded-full border border-yellow-200`}>NEW</span>
                    </div>
                )}

                {/* (Quick view removed: clicking opens compact product page) */}

                {/* Zoom Controls Overlay */}
                {showZoomControls && !isSmall && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            title="Zoom In"
                            className="w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 1}
                            title="Zoom Out"
                            className="w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ZoomOut size={16} />
                        </button>
                    </div>
                )}

                {/* Zoom level indicator */}
                {zoom > 1 && !isSmall && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
                        {Math.round(zoom * 100)}%
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className={`${isSmall ? 'p-2' : 'p-4'} flex-1 flex flex-col bg-white`}> 
                <h3
                    onClick={handleProductClick}
                    className={`font-bold text-gray-800 ${isSmall ? 'text-sm mb-1' : 'text-lg mb-2'} line-clamp-2 cursor-pointer hover:text-blue-600 leading-tight ${isSmall ? '' : 'min-h-[3rem]'}`}
                >
                    {product.name}
                </h3>

                {/* Subcategory chip */}
                {product.subcategory && (
                    <div className="mb-2">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-blue-800 bg-blue-100 border border-blue-200">{product.subcategory}</span>
                    </div>
                )}

                <div className="mb-3 space-y-1">
                    <p className="text-gray-600 font-medium text-sm">
                        Price: <span className="font-semibold text-gray-900">{priceDisplay}</span>
                    </p>
                    {sizeLabels.length > 0 && (
                        <p className="text-gray-600 font-medium text-sm">
                            Sizes: <span className="font-semibold text-indigo-700">{sizeLabels.join(', ')}</span>
                        </p>
                    )}
                    <p className={`inline-flex items-center gap-2 font-medium text-sm rounded-lg px-3 py-2 border ${isOutOfStock ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-emerald-50 border-emerald-200'}`}>
                        {isOutOfStock ? 'Status:' : 'Quantity in Stock:'}
                        <span className={`font-semibold ${isOutOfStock ? 'text-red-700' : 'text-emerald-700'}`}>{isOutOfStock ? 'Out of Stock' : quantityInStock}</span>
                    </p>
                </div>

                {/* Buttons Area */}
                <div className={`mt-auto flex ${isSmall ? 'flex-row items-center gap-2 pt-1' : 'flex-col gap-2 pt-2'}`}>
                    {/* Email and WhatsApp Row */}
                    <div className={`${isSmall ? 'grid grid-cols-1 gap-1 w-full' : 'grid grid-cols-2 gap-2'}`}>
                        <a
                            href={gmailComposeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`${isSmall ? 'bg-orange-500 text-white px-2 py-1 rounded-md text-xs' : 'bg-orange-500 text-white px-2 py-2 rounded-md text-xs sm:text-sm'} hover:bg-orange-600 font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors`}
                        >
                            <Mail size={16} />
                            <span className="truncate">Email</span>
                        </a>

                        <a
                            href={`https://wa.me/${businessWhatsApp}?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`${isSmall ? 'bg-[#25D366] text-white px-2 py-1 rounded-md text-xs' : 'bg-[#25D366] text-white px-2 py-2 rounded-md text-xs sm:text-sm'} hover:bg-[#1ebd5c] font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                                <path d="M20.52 3.48A11.86 11.86 0 0012.06.5C6.02.5 1.11 5.41 1.11 11.45c0 2.02.54 3.89 1.48 5.53L.5 23.5l6.7-1.76c1.58.86 3.36 1.32 5.01 1.32h.01c6.03 0 10.94-4.91 10.94-10.95 0-2.93-1.14-5.68-3.64-7.63zM12.06 20.09c-1.5 0-2.97-.4-4.24-1.14l-.3-.18-3.98 1.05 1.07-3.87-.19-.31A7.29 7.29 0 014.77 8.8c0-4.03 3.27-7.3 7.3-7.3 1.95 0 3.78.76 5.16 2.14a7.28 7.28 0 01-5.17 12.45z" />
                                <path d="M17.56 14.2c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2 0-.38-.02-.53-.02-.14-.68-1.64-.93-2.24-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.53.07-.81.37-.28.3-1.06 1.04-1.06 2.53 0 1.48 1.09 2.92 1.24 3.12.15.2 2.14 3.35 5.18 4.7 3.04 1.35 3.04.9 3.59.84.55-.06 1.77-.72 2.02-1.41.25-.69.25-1.28.18-1.41-.07-.13-.28-.2-.58-.35z" />
                            </svg>
                            <span className="truncate">WhatsApp</span>
                        </a>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`${isSmall ? 'px-3 py-2 rounded-md text-sm' : 'w-full px-4 py-2.5 rounded-md text-sm'} font-semibold shadow-sm flex justify-center items-center gap-2 transition-colors mt-1 ${isOutOfStock ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <ShoppingCart size={18} />
                        {isOutOfStock ? 'Out of Stock' : (Array.isArray(product.size_options) && product.size_options.length > 0 ? 'Select Size' : 'Add to Cart')}
                    </button>
                </div>
            </div>

            {/* quick view removed */}
        </div>
    );
};

export default ProductCard;
