import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ShopLocationCard from '../components/ShopLocationCard';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, heroTextReveal, cardHover, sectionReveal, buttonTap } from '../utils/motionVariants';
import AnimatedNavbar from '../components/AnimatedNavbar';
import AllProductsGrid from '../components/AllProductsGrid';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import SocialSidebar from '../components/SocialSidebar';
import { ChevronDown, ChevronRight, ChevronUp, Heart, ShoppingCart, Shirt, ShoppingBag, HardHat, Cloud, Eye, Ear, Hand, Shield, Flame, Truck, TrafficCone, Droplet, Volume2, VolumeX } from 'lucide-react';
import getFullImageUrl from '../utils/getFullImageUrl';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [productsCatalog, setProductsCatalog] = React.useState([]);
  const [homeCategories, setHomeCategories] = React.useState([]);
  const [allCategoriesData, setAllCategoriesData] = React.useState([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);

  const defaultCategories = [
    { name: 'WORK WEAR', icon: Shirt },
    { name: 'FOOT PROTECTION', icon: ShoppingBag },
    { name: 'HEAD PROTECTION', icon: HardHat },
    { name: 'DUSTMASK', icon: Cloud },
    { name: 'EYE PROTECTION', icon: Eye },
    { name: 'EAR PROTECTION', icon: Ear },
    { name: 'GLOVES', icon: Hand },
    { name: 'FALL PROTECTION', icon: Shield },
    { name: 'FIRE PROTECTION', icon: Flame },
    { name: 'HAND TRUCKS', icon: Truck },
    { name: 'ROAD SAFETY', icon: TrafficCone },
    { name: 'LADDERS', icon: HardHat },
    { name: 'SPILL KIT', icon: Droplet }
  ];

  const categoryIconMap = {
    'work wear': Shirt,
    'foot protection': ShoppingBag,
    'head protection': HardHat,
    'dustmask': Cloud,
    'eye protection': Eye,
    'ear protection': Ear,
    'gloves': Hand,
    'fall protection': Shield,
    'fire protection': Flame,
    'hand trucks': Truck,
    'road safety': TrafficCone,
    'ladders': HardHat,
    'spill kit': Droplet,
  };

  const normalizeCategoryKey = (value) => String(value || '').trim().toLowerCase();

  const getCategoryIcon = (categoryName) => {
    const key = normalizeCategoryKey(categoryName);
    return categoryIconMap[key] || Shield;
  };

  const handleCategoryNavigate = (category) => {
    window.scrollTo(0, 0);
    const categoryId = Number(category?.id || 0);
    if (Number.isFinite(categoryId) && categoryId > 0) {
      navigate(`/products?categoryId=${encodeURIComponent(categoryId)}`);
      return;
    }

    const categoryName = String(category?.name || category?.category || '').trim();
    if (categoryName) {
      navigate(`/products?category=${encodeURIComponent(categoryName)}`);
      return;
    }

    navigate('/products');
  };

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/categories');
        const data = await res.json();
        if (data?.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setAllCategoriesData(data.categories);
          const roots = data.categories
            .filter((cat) => !cat.parent_id)
            .sort((a, b) => String(a.name || a.category || '').localeCompare(String(b.name || b.category || '')));
          setHomeCategories(roots.length > 0 ? roots : defaultCategories);
          return;
        }
      } catch (_e) {
        // fallback to static categories below
      }
      setHomeCategories(defaultCategories);
      setAllCategoriesData([]);
    };

    loadCategories().finally(() => setCategoriesLoading(false));
  }, []);

  const brandLogos = [
    { name: 'ESAB', logo: '/brands/esab.jpeg' },
    { name: 'Patta', logo: '/brands/patta.jpeg' },
    { name: 'Skole', logo: '/brands/skole.jpeg' },
    { name: 'Vaultex', logo: '/brands/vaultex.jpeg' },
    { name: 'Beta', logo: '/brands/beta.jpeg' },
    { name: 'Zecchin', logo: '/brands/zecchin.jpeg' },
    { name: 'Armour Production', logo: '/brands/armour.jpeg' },
    { name: 'Jumlee', logo: '/brands/jumlee.jpeg' },
    { name: 'Stanley', logo: '/brands/stanley.jpeg' },
    { name: 'Makita', logo: '/brands/makita.jpeg' },
    { name: 'Edon', logo: '/brands/edon.jpeg' },
    { name: 'Honeywell', logo: '/brands/honeywell.jpeg' },
    { name: 'Delta Plus', logo: '/brands/delta-plus.jpeg' },
    { name: 'Goldcamel', logo: '/brands/goldcamel.jpeg' },
    { name: 'Kurt', logo: '/brands/kurt.jpeg' },
    { name: 'Taha Safety', logo: '/brands/taha-safety.jpeg' },
    { name: 'Workman', logo: '/brands/workman.jpeg' },
  ];

  const newArrivals = [
    { name: 'Chemical Protective Coverall', category: 'Chemical Protection', image: 'https://placehold.co/300x200/EEE/999?text=Chemical+Coverall' },
    { name: 'Chemical Protective Pant Shirt', category: 'Chemical Protection', image: 'https://placehold.co/300x200/EEE/999?text=Protective+Pant' },
    { name: 'Workman SG-3006C', category: 'Promotional Images', image: 'https://placehold.co/300x200/EEE/999?text=Workman+SG-3006C' },
    { name: 'Workman - SG-71061', category: 'Promotional Images', image: 'https://placehold.co/300x200/EEE/999?text=Workman+SG-71061' },
    { name: 'DeltaPlus M1300VB', category: 'Promotional Images', image: 'https://placehold.co/300x200/EEE/999?text=DeltaPlus+M1300VB' },
    { name: 'DeltaPlus M1300V', category: 'Promotional Images', image: 'https://placehold.co/300x200/EEE/999?text=DeltaPlus+M1300V' },
    { name: 'DeltaPlus M1200V', category: 'Promotional Images', image: 'https://placehold.co/300x200/EEE/999?text=DeltaPlus+M1200V' },
    { name: 'DeltaPlus M1200', category: 'Promotional Images', image: 'https://placehold.co/300x200/EEE/999?text=DeltaPlus+M1200' },
  ];

  const [specialOffers, setSpecialOffers] = React.useState([]);
  const [specialOfferLikes, setSpecialOfferLikes] = React.useState({});
  const [heroMedia, setHeroMedia] = React.useState({ type: 'image', video: '', videoUrl: '' });
  const [heroMuted, setHeroMuted] = React.useState(false);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(true);

  const getOfferLikeKey = React.useCallback((offer) => {
    const id = Number(offer?.id || offer?.special_offer_id || 0);
    if (Number.isFinite(id) && id > 0) return `offer-${id}`;
    return `offer-${normalizeText(offer?.name || '')}`;
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('avataSpecialOfferLikes');
      const parsed = raw ? JSON.parse(raw) : {};
      setSpecialOfferLikes(parsed && typeof parsed === 'object' ? parsed : {});
    } catch (_e) {
      setSpecialOfferLikes({});
    }
  }, []);

  const persistSpecialOfferLikes = React.useCallback((next) => {
    try {
      localStorage.setItem('avataSpecialOfferLikes', JSON.stringify(next));
    } catch (_e) {
      // ignore storage failures
    }
  }, []);

  const toggleSpecialOfferLike = (offer) => {
    const key = getOfferLikeKey(offer);
    setSpecialOfferLikes((prev) => {
      const current = prev[key] || { count: 0, liked: false };
      const nextLiked = !current.liked;
      const nextCount = Math.max(0, Number(current.count || 0) + (nextLiked ? 1 : -1));
      const next = {
        ...prev,
        [key]: { count: nextCount, liked: nextLiked }
      };
      persistSpecialOfferLikes(next);
      return next;
    });
  };

  React.useEffect(() => {
    const updateScrollState = () => {
      const top = window.scrollY || window.pageYOffset || 0;
      const viewport = window.innerHeight || 0;
      const doc = document.documentElement;
      const pageHeight = Math.max(doc.scrollHeight || 0, document.body.scrollHeight || 0);
      setCanScrollUp(top > 160);
      setCanScrollDown(top + viewport < pageHeight - 120);
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollBottom = () => {
    const doc = document.documentElement;
    const pageHeight = Math.max(doc.scrollHeight || 0, document.body.scrollHeight || 0);
    window.scrollTo({ top: pageHeight, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const loadOffers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/special-offers');
        const d = await res.json();
        if (d && d.success && Array.isArray(d.offers)) setSpecialOffers(d.offers);
      } catch (e) {
        // fallback to defaults
        setSpecialOffers([
          { id: 1, name: 'DUSTMASK VIC 824 FLAT CERTIFIED', category: 'Mask without Valve', originalPrice: 15.00, currentPrice: 12.00, image: 'https://placehold.co/300x200/EEE/999?text=VIC+824+Dustmask' },
          { id: 2, name: 'DELTAPLUS RESPIRATOR CARTRIDGE M6000 P3R', category: 'Respirators', originalPrice: 39.00, currentPrice: 34.00, image: 'https://placehold.co/300x200/EEE/999?text=M6000+P3R+Respirator' },
          { id: 3, name: 'Deltaplus VE801 33CM Nitrile Safety Gloves', category: 'Nitrile Gloves', originalPrice: 10.60, currentPrice: 9.50, image: 'https://placehold.co/300x200/EEE/999?text=VE801+Safety+Gloves' },
          { id: 4, name: 'WORKMAN DUSTMASK WK SURGICAL MASK 3 PLY', category: 'Mask without Valve', originalPrice: 5.00, currentPrice: 4.00, image: 'https://placehold.co/300x200/EEE/999?text=Surgical+Mask+3PLY' }
        ]);
      }
    };
    loadOffers();
  }, []);

  React.useEffect(() => {
    const loadHeroMedia = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/hero-media');
        const data = await res.json();
        if (data?.success && data.media) {
          setHeroMedia(data.media);
        }
      } catch (error) {
        console.error('Failed to load hero media:', error);
      }
    };
    loadHeroMedia();
  }, []);

  React.useEffect(() => {
    const loadProductsCatalog = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        setProductsCatalog(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load products for special offers:', error);
        setProductsCatalog([]);
      }
    };

    loadProductsCatalog();
  }, []);

  const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const resolveOfferProduct = (offer) => {
    const linkedId = Number(offer.linkedProductId || offer.productId || offer.product_id || 0);
    if (Number.isFinite(linkedId) && linkedId > 0) {
      return productsCatalog.find((p) => Number(p.id) === linkedId) || null;
    }

    const offerName = String(offer.name || '').trim().toLowerCase();
    if (!offerName) return null;

    const exactMatch = productsCatalog.find((p) => String(p.name || '').trim().toLowerCase() === offerName);
    if (exactMatch) return exactMatch;

    const normalizedOfferName = normalizeText(offer.name);
    const containsByName = productsCatalog.find((p) => {
      const normalizedProductName = normalizeText(p.name);
      return normalizedProductName && (
        normalizedProductName.includes(normalizedOfferName)
        || normalizedOfferName.includes(normalizedProductName)
      );
    });
    if (containsByName) return containsByName;

    const normalizedCategory = normalizeText(offer.category);
    if (!normalizedCategory) return null;
    return productsCatalog.find((p) => {
      const normalizedProductCategory = normalizeText(p.category || p.category_name || '');
      return normalizedProductCategory && (
        normalizedProductCategory.includes(normalizedCategory)
        || normalizedCategory.includes(normalizedProductCategory)
      );
    }) || null;
  };

  const handleProductClick = (offer) => {
    const matchedProduct = resolveOfferProduct(offer);
    if (matchedProduct?.id) {
      navigate(`/product/${matchedProduct.id}`);
      return;
    }

    alert('This offer has no product detail page yet. Use Add to Cart to order it directly.');
  };

  const handleSpecialOfferAddToCart = (offer) => {
    const matchedProduct = resolveOfferProduct(offer);
    if (matchedProduct) {
      const stock = Number(matchedProduct?.stock ?? 0);
      if (!Number.isFinite(stock) || stock <= 0) {
        alert(`${matchedProduct.name} is out of stock.`);
        return;
      }

      const primaryMedia = Array.isArray(matchedProduct.media) && matchedProduct.media.length > 0
        ? matchedProduct.media[0]
        : (matchedProduct.images?.[0] ? { type: 'image', url: matchedProduct.images[0] } : null);

      const offerPrice = Number(offer?.currentPrice || 0);
      const hasOfferPrice = Number.isFinite(offerPrice) && offerPrice > 0;

      const result = addToCart({
        ...matchedProduct,
        price: hasOfferPrice ? offerPrice : Number(matchedProduct.price || 0),
        selectedImage: primaryMedia?.url || matchedProduct.image
      }, 1);

      if (!result?.success) {
        alert(result?.message || 'Could not add this item to cart.');
        return;
      }
      alert('Added to Cart. You can order it in the normal checkout flow.');
      return;
    }

    const specialOfferStock = Number(offer?.stock ?? 100);
    if (!Number.isFinite(specialOfferStock) || specialOfferStock <= 0) {
      alert(`${offer.name || 'This special offer'} is out of stock.`);
      return;
    }

    const specialOfferPrice = Number(offer?.currentPrice || 0);
    const specialOfferId = Number(offer?.id || offer?.special_offer_id || 0);
    const result = addToCart({
      id: `special-offer-${specialOfferId || Date.now()}`,
      special_offer_id: specialOfferId > 0 ? specialOfferId : null,
      item_type: 'special_offer',
      name: offer?.name || 'Special Offer',
      category: offer?.category || 'Special Offer',
      price: Number.isFinite(specialOfferPrice) && specialOfferPrice > 0 ? specialOfferPrice : 0,
      stock: Math.max(0, Math.trunc(specialOfferStock)),
      image: offer?.image,
      selectedImage: offer?.image
    }, 1);

    if (!result?.success) {
      alert(result?.message || 'Could not add this item to cart.');
      return;
    }
    alert('Added to Cart. You can order it in the normal checkout flow.');
  };

  return (
    <div className="min-h-screen w-full bg-white overflow-x-hidden">
      <AnimatedNavbar>
        <Header />
      </AnimatedNavbar>
      <SocialSidebar />
      {/* Animated Hero Section */}
      <motion.section
        className="text-white py-8 sm:py-12 md:py-16 lg:py-20 w-full relative overflow-hidden flex items-center justify-center mt-8 min-h-[400px] sm:min-h-[450px] md:min-h-[500px]"
        initial="hidden"
        animate="visible"
        variants={sectionReveal}
      >
        {heroMedia.type === 'video' && (heroMedia.videoUrl || heroMedia.video) ? (
          <video
            key={heroMedia.videoUrl || heroMedia.video}
            className="absolute inset-0 w-full h-full object-cover"
            src={heroMedia.videoUrl || getFullImageUrl(heroMedia.video)}
            autoPlay
            loop
            playsInline
            muted={heroMuted}
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/src/background-image.jpeg')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-black/10 to-blue-900/10" />

        {heroMedia.type === 'video' && (heroMedia.videoUrl || heroMedia.video) && (
          <button
            type="button"
            onClick={() => setHeroMuted((prev) => !prev)}
            className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-black/60"
          >
            {heroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {heroMuted ? 'Sound Off' : 'Sound On'}
          </button>
        )}

        <div className="max-w-2xl w-full text-center px-3 sm:px-4 md:px-6 mx-auto flex flex-col items-center justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-4 sm:mb-6 md:mb-8"
          />
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-2 sm:mb-3 md:mb-4 tracking-tight drop-shadow-2xl flex justify-center items-center flex-wrap"
            variants={heroTextReveal}
            initial="hidden"
            animate="visible"
          >
            <span className="bg-gradient-to-r from-blue-900 via-blue to-blue-900 text-transparent bg-clip-text drop-shadow-xl">
              Welcome To AVATA Trading LTD
            </span>
          </motion.h1>
          <motion.div
            className="flex justify-center mb-4 sm:mb-5 md:mb-6"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <span className="bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 shadow-lg text-yellow-600 text-xs sm:text-sm md:text-base font-medium border border-blue-600">
              <span className="text-xs sm:text-sm md:text-base">Your reliable source for  all Industrial 🏭 Construction Tools & PPE’s</span>
            </span>
          </motion.div>
          <motion.button
            onClick={() => navigate('/products')}
            className="bg-white text-blue-700 px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold shadow-xl hover:bg-blue-50 text-sm sm:text-base md:text-lg transition-all duration-200 w-full sm:w-auto max-w-xs"
            variants={buttonTap}
            whileTap="tap"
            whileHover={{ scale: 1.06, backgroundColor: '#be8e25' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            SHOP NOW
          </motion.button>
        </div>
      </motion.section>

      <main className="w-full max-w-full">
        <div className="w-full px-2 sm:px-4 lg:px-6 mx-auto">
          <ShopLocationCard />
        </div>

        {/* Shop by Category */}
        <motion.section className="py-8 sm:py-12 md:py-16 bg-white w-full" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="w-full px-2 sm:px-4 lg:px-6 mx-auto">
            <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-transparent bg-clip-text drop-shadow-lg" variants={heroTextReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              Shop by Category
            </motion.h2>
            <p className="text-center text-sm sm:text-base text-slate-600 mb-10 max-w-2xl mx-auto">
              Browse our category tiles for quick access to the safety gear and equipment you need.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {categoriesLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="rounded-[28px] border border-slate-200 bg-blue shadow-[0_18px_45px_rgba(15,23,42,0.05)] p-6 animate-pulse h-56" />
                ))
              ) : (
                <>
                  {homeCategories.map((category) => {
                    const categoryName = String(category?.name || category?.category || 'Category');
                    const CategoryIcon = getCategoryIcon(categoryName);
                    return (
                      <motion.button
                        key={`category-${category.id || categoryName}`}
                        type="button"
                        whileHover={{ y: -6, boxShadow: '0 32px 70px rgba(15, 23, 42, 0.12)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategoryNavigate(category)}
                        className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* CATEGORY IMAGE — reduced from h-56 to h-36 */}
                        <div className="relative h-36 overflow-hidden bg-slate-100">
                          {category?.image ? (
                            <img
                              src={getFullImageUrl(category.image)}
                              alt={categoryName}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800">
                              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 shadow-inner">
                                <CategoryIcon className="h-9 w-9 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-95" />
                        </div>

                        <div className="relative flex flex-1 flex-col justify-between p-4 bg-white">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">Category</p>
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                              {categoryName}
                            </h3>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">Explore products</span>
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition-all duration-300 group-hover:bg-yellow-600 group-hover:text-white">
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* All Available Products */}
        <motion.section className="py-8 sm:py-12 md:py-16 bg-white w-full" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="w-full px-2 sm:px-4 lg:px-6 mx-auto">
            <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-8 sm:mb-12 bg-gradient-to-r from-blue-600 via-pink-500 to-red-600 text-transparent bg-clip-text drop-shadow-lg" variants={heroTextReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              All Available Products
            </motion.h2>
            <AllProductsGrid />
          </div>
        </motion.section>

        {/* Shop Our Brands */}
        <motion.section className="py-8 sm:py-10 md:py-12 w-full bg-gradient-to-b from-slate-50 to-white" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="w-full px-2 sm:px-4 lg:px-6 mx-auto">
            <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-2 sm:mb-3 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-transparent bg-clip-text drop-shadow-lg" variants={heroTextReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              Shop Our Brands
            </motion.h2>
            <p className="text-center text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">Trusted global safety and tool brands available at AVATA Trading.</p>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={14}
              slidesPerView={5}
              navigation
              pagination={{ clickable: true }}
              loop
              autoplay={{ delay: 2600, disableOnInteraction: false }}
              className="w-full max-w-6xl mx-auto"
              style={{ minHeight: '190px', paddingBottom: '20px' }}
              breakpoints={{
                320: { slidesPerView: 2 },
                640: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 }
              }}
            >
              {brandLogos.map((brand) => (
                <SwiperSlide key={brand.name}>
                  <div className="group h-[160px] rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-3 flex flex-col items-center justify-between">
                    <div className="h-[100px] w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-h-[92px] max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <span
                        className="hidden h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold px-2 text-center"
                        aria-hidden="true"
                      >
                        {brand.name}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 text-center line-clamp-1">{brand.name}</span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.section>

        {/* Special Offer */}
        <motion.section id="special-offers-section" className="py-8 sm:py-12 md:py-16 bg-red-50 w-full" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="w-full px-3 sm:px-4 md:px-6 mx-auto">
            <motion.h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 md:mb-12 bg-gradient-to-r from-red-600 via-pink-500 to-yellow-400 text-transparent bg-clip-text drop-shadow-lg" variants={heroTextReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              Special Offer
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
              {specialOffers.map((product, index) => (
                (() => {
                  const matchedProduct = resolveOfferProduct(product);
                  const offerStock = Number(product?.stock ?? 100);
                  const matchedStock = Number(matchedProduct?.stock ?? offerStock);
                  const isOutOfStock = !Number.isFinite(matchedStock) || matchedStock <= 0;
                  const likeKey = getOfferLikeKey(product);
                  const likeState = specialOfferLikes[likeKey] || { count: 0, liked: false };
                  const originalPrice = Number(product.originalPrice || 0);
                  const currentPrice = Number(product.currentPrice || 0);
                  return (
                    <motion.div
                      key={index}
                      className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow flex flex-col"
                      variants={cardHover}
                      initial="rest"
                      whileHover="hover"
                    >
                      {/* SPECIAL OFFER IMAGE — fixed height 140px, tighter rounded corners */}
                      <div
                        className="relative w-full overflow-hidden rounded-lg border border-red-200 shadow mb-3 cursor-pointer"
                        onClick={() => handleProductClick(product)}
                        style={{ height: '140px' }}
                      >
                        <motion.img
                          src={getFullImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          variants={fadeIn}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md tracking-wide">OUT OF STOCK</span>
                          </div>
                        )}
                      </div>
                      <motion.h3
                        onClick={() => handleProductClick(product)}
                        className="font-semibold mb-1 cursor-pointer hover:text-blue-600 text-center text-sm sm:text-base line-clamp-2"
                        whileHover={{ color: '#2563eb', scale: 1.05 }}
                      >
                        {product.name}
                      </motion.h3>
                      <p className="text-xs text-gray-600 mb-1 text-center">{product.category}</p>
                      <div className="mb-2 flex justify-center">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${isOutOfStock ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          Quantity in Stock:
                          <span className="font-bold">{Number.isFinite(matchedStock) ? matchedStock : 0}</span>
                        </span>
                      </div>
                      <div className="mb-2 sm:mb-3 text-center flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                        <span className="text-xs text-gray-500 line-through">RWF {originalPrice.toLocaleString()}</span>
                        <span className="text-sm text-red-600 font-bold">RWF {currentPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-center w-full mt-auto gap-2">
                        <motion.button
                          disabled={isOutOfStock}
                          className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-bold shadow-md transition-all w-full sm:w-auto ${isOutOfStock ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                          variants={buttonTap}
                          whileTap="tap"
                          onClick={() => handleSpecialOfferAddToCart(product)}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </motion.button>
                        <motion.button
                          onClick={() => toggleSpecialOfferLike(product)}
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                          whileHover={{ color: '#dc2626', scale: 1.05 }}
                        >
                          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${likeState.liked ? 'fill-red-500 text-red-500' : ''}`} />
                          <span className="text-xs font-bold">{likeState.count}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })()
              ))}
            </div>
          </div>
        </motion.section>

        {/* About Us */}
        <motion.section id="about-us-section" className="py-8 sm:py-10 md:py-12 lg:py-16 w-full bg-white flex flex-col items-center" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="w-full max-w-4xl px-3 sm:px-4 md:px-6 mx-auto flex flex-col items-center">
            <motion.h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900" variants={heroTextReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              About Us
            </motion.h2>
            <motion.p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-center text-gray-700 mb-6 sm:mb-8 md:mb-10 px-2" variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              More Years in the PPE industry and construction, AVATA is one of the leading importers and exporters of PPE and construction materials. We provide high-quality products to ensure safety and reliability in construction projects.
            </motion.p>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              <div className="group rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200 bg-white">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80"
                    alt="Our Business"
                    className="w-full h-44 sm:h-52 md:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white font-bold text-sm sm:text-base">Our Business</div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-sm sm:text-base text-gray-700">
                    AVATA specializes in PPE and construction materials, serving clients across Rwanda and East Africa.
                  </p>
                </div>
              </div>
              <div className="group rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-blue-200 bg-blue-50">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80"
                    alt="Location Facts"
                    className="w-full h-44 sm:h-52 md:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/55 via-blue-900/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white font-bold text-sm sm:text-base">Location Facts</div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-sm sm:text-base text-blue-900">
                    Our main warehouse is in Kigali, with distribution points across the region for faster delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col gap-2">
        {canScrollUp && (
          <button
            type="button"
            onClick={handleScrollTop}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
            aria-label="Go to top"
            title="Go to top"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {canScrollDown && (
          <button
            type="button"
            onClick={handleScrollBottom}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-900 transition"
            aria-label="Go to bottom"
            title="Go to bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Home;