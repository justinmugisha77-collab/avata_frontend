import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, ChevronDown, LogOut, Package, ChevronRight, Menu, X } from 'lucide-react';
import LoginRegisterModal from './LoginRegisterModal';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const normalizeForSearch = (value) => String(value || '').toLowerCase();
const simplifyForSearch = (value) => normalizeForSearch(value).replace(/[aeiou]/g, '').replace(/[^a-z0-9]/g, '');

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, saveRedirectPath } = useAuth();
  const { cart, cartCount } = useCart();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Product categories for dropdown (fetched from backend)
  const [productCategories, setProductCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState({});
  const dropdownTimerRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories)) {
          setProductCategories(data.categories);
        }
      })
      .catch(() => setProductCategories([]));
  }, []);

  const rootCategories = React.useMemo(
    () => productCategories.filter((cat) => !cat.parent_id),
    [productCategories]
  );

  const getSubcategories = (parentId) => productCategories.filter((cat) => Number(cat.parent_id) === Number(parentId));
  const hasChildren = (categoryId) => getSubcategories(categoryId).length > 0;

  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategoryIds((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryNavigate = (category) => {
    navigate(`/products?categoryId=${encodeURIComponent(category.id)}`);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const renderCategoryTreeNode = (category, depth = 0) => {
    const children = getSubcategories(category.id);
    const expanded = !!expandedCategoryIds[category.id];

    const onMouseEnterCategory = () => {
      // Auto-expand on hover when in dropdown
      if (children.length > 0 && !expanded) {
        setExpandedCategoryIds(prev => ({ ...prev, [category.id]: true }));
      }
    };

    const onMouseLeaveCategory = () => {
      // Collapse after hover if at root level (depth 0)
      if (depth === 0 && expanded && children.length > 0) {
        setExpandedCategoryIds(prev => ({ ...prev, [category.id]: false }));
      }
    };

    return (
      <div
        key={category.id}
        className="border-b border-gray-50 last:border-none"
        onMouseEnter={onMouseEnterCategory}
        onMouseLeave={onMouseLeaveCategory}
      >
        <div className="flex items-center">
          {
            (() => {
              const isRoot = depth === 0;
              const btnClass = `${isRoot ? 'category-button text-sm font-semibold' : 'subcategory-button text-sm font-medium'} flex-1 text-left px-4 py-2.5 transition-colors`;
              return (
                <button
                  type="button"
                  onClick={() => handleCategoryNavigate(category)}
                  className={btnClass}
                  style={{ paddingLeft: `${16 + depth * 14}px` }}
                >
                  {category.name}
                </button>
              );
            })()
          }
          {children.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategoryExpanded(category.id);
              }}
              className="px-3 py-2.5 text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={expanded ? 'Collapse subcategories' : 'Expand subcategories'}
              title={expanded ? 'Hide subcategories' : 'Show subcategories'}
            >
              <ChevronRight size={14} className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="px-3 py-2.5 text-gray-200" aria-hidden="true">
              <ChevronRight size={14} />
            </span>
          )}
        </div>
        {expanded && children.length > 0 && (
          <div>
            {children.map((child) => renderCategoryTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleDropdownEnter = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setDropdownOpen(true);
  };
  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setDropdownOpen(false), 200);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setAllProducts(data || []))
      .catch(() => setAllProducts([]));
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!userDropdownRef.current) return;
      if (!userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 1) {
      const needle = normalizeForSearch(value);
      const simplifiedNeedle = simplifyForSearch(value);
      const filtered = allProducts.filter(p =>
        normalizeForSearch(p.name).includes(needle) ||
        normalizeForSearch(p.category_name || p.category).includes(needle) ||
        simplifyForSearch(p.name).includes(simplifiedNeedle) ||
        simplifyForSearch(p.category_name || p.category).includes(simplifiedNeedle)
      ).slice(0, 5); // Show top 5 matches
      setSearchResults(filtered);
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const navigate = useNavigate();

  return (
    <>
      <header className="bg-white shadow-md w-full sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 w-full">
          <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
            {/* Left: Logo + Desktop Nav */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/" className="flex items-center">
                <img src="/logo-avata.jpeg" alt="AVATA Logo" className="h-8 sm:h-10 md:h-12 w-auto mr-1 sm:mr-2" />
                <span className="text-sm sm:text-lg md:text-xl font-bold text-blue-600 hidden sm:inline whitespace-nowrap">AVATA LTD</span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-4 xl:space-x-6 relative items-center">
                <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium text-sm xl:text-base">Home</Link>

                {/* Products with categories hover dropdown */}
                <div
                  className="relative"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    to="/products"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium text-sm xl:text-base"
                  >
                    Categories
                    <ChevronDown size={15} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 min-w-[760px] bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl z-[200]"
                      onMouseEnter={handleDropdownEnter}
                      onMouseLeave={handleDropdownLeave}
                    >
                      {/* Header row */}
                      <div className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                        Shop by Category
                      </div>

                      {/* All Products link */}
                      <Link
                        to="/products"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-gray-800 font-semibold border-b border-gray-100 transition-colors group"
                      >
                        <span>All Products</span>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600" />
                      </Link>

                      {/* Vertical, scrollable category list with nested subcategories */}
                      <div className="p-4 category-dropdown">
                        {rootCategories.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-400 italic">Loading categories...</div>
                        ) : (
                          <div className="grid grid-cols-4 gap-x-4 gap-y-2 relative">
                            {rootCategories.map((cat) => (
                              <div key={cat.id} className="relative group">
                                <button
                                  type="button"
                                  className="category-button text-sm font-semibold flex-1 text-left px-3 py-2 transition-colors w-full text-blue-900 hover:bg-blue-50 flex items-center justify-between rounded-md"
                                  onMouseEnter={() => setExpandedCategoryIds({ [cat.id]: true })}
                                  onMouseLeave={() => setExpandedCategoryIds({})}
                                  onClick={() => handleCategoryNavigate(cat)}
                                >
                                  <span>{cat.name}</span>
                                  {getSubcategories(cat.id).length > 0 && (
                                    <span className="ml-2 text-blue-400">
                                      <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </span>
                                  )}
                                </button>
                                {expandedCategoryIds[cat.id] && getSubcategories(cat.id).length > 0 && (
                                  <div
                                    className="absolute top-0 left-full ml-2 w-56 bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl z-[300] p-3"
                                    onMouseEnter={() => setExpandedCategoryIds({ [cat.id]: true })}
                                    onMouseLeave={() => setExpandedCategoryIds({})}
                                  >
                                    {getSubcategories(cat.id).map((subcat) => (
                                      <button
                                        key={subcat.id}
                                        type="button"
                                        className="subcategory-button text-sm font-normal flex-1 text-left px-3 py-2 transition-colors w-full hover:bg-blue-50 text-gray-700 rounded-md"
                                        onClick={() => handleCategoryNavigate(subcat)}
                                      >
                                        {subcat.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="text-gray-700 hover:text-blue-600 bg-transparent border-none outline-none cursor-pointer font-medium text-sm xl:text-base"
                  onClick={() => {
                    if (window.location.pathname !== '/') {
                      navigate('/');
                      setTimeout(() => {
                        const offerSection = document.getElementById('special-offers-section');
                        if (offerSection) offerSection.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      const offerSection = document.getElementById('special-offers-section');
                      if (offerSection) offerSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Special Offer
                </button>
                <Link to="/advertisement" className="text-gray-700 hover:text-blue-600 font-medium text-sm xl:text-base">Avata advert</Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium text-sm xl:text-base">Contact Us</Link>
              </nav>
            </div>

            {/* Right: Search, Cart, User, Mobile Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Desktop Search */}
              <div className="relative hidden md:flex flex-1 max-w-xs lg:max-w-md">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim().length > 1 && setShowSearchSuggestions(true)}
                  className="w-full border border-gray-300 rounded-full px-3 lg:px-4 py-1.5 lg:py-2 pl-9 lg:pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/products?search=${searchQuery.toLowerCase()}`);
                      setShowSearchSuggestions(false);
                    }
                  }}
                />
                <Search className="absolute left-2 lg:left-3 top-2 lg:top-2.5 text-gray-400" size={18} />

                {/* Search Suggestions Dropdown */}
                {showSearchSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          navigate(`/product/${product.id}`);
                          setShowSearchSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-none transition-colors"
                      >
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                          <img src={product.image || 'https://placehold.co/100x100/EEE/999?text=Product'} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 uppercase">{product.category_name || 'Product'}</p>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => {
                        navigate(`/products?search=${searchQuery.toLowerCase()}`);
                        setShowSearchSuggestions(false);
                      }}
                      className="px-4 py-2 bg-gray-50 text-blue-600 text-xs font-bold text-center cursor-pointer hover:bg-blue-100"
                    >
                      See all results for "{searchQuery}"
                    </div>
                  </div>
                )}
                {showSearchSuggestions && searchQuery.trim().length > 1 && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] p-4 text-center text-gray-500 text-sm italic">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Cart Icon */}
              <Link to="/cart" className="text-gray-700 hover:text-blue-600 relative">
                <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown - Desktop */}
              {isAuthenticated && user ? (
                <div
                  ref={userDropdownRef}
                  className="relative hidden md:block"
                >
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(prev => !prev)}
                    className="flex items-center text-gray-700 hover:text-blue-600 focus:outline-none"
                  >
                    <User size={22} className="lg:w-6 lg:h-6" />
                    <ChevronDown size={16} className="ml-1 lg:w-5 lg:h-5" />
                  </button>
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/my-account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2"
                      >
                        <Package size={16} />
                        My Account Orders
                      </Link>
                      <Link
                        to="/my-account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2"
                      >
                        <User size={16} />
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          setTimeout(() => {
                            window.location.replace('/');
                          }, 100);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-200"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-gray-700 hover:text-blue-600 hidden md:block"
                  aria-label="Login or Register"
                >
                  <User size={22} className="lg:w-6 lg:h-6" />
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-gray-700 hover:text-blue-600 p-1"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar - Below header on mobile */}
          <div className="relative md:hidden mt-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim().length > 1 && setShowSearchSuggestions(true)}
              className="w-full border border-gray-300 rounded-full px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/products?search=${searchQuery.toLowerCase()}`);
                  setShowSearchSuggestions(false);
                  setMobileMenuOpen(false);
                }
              }}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

            {/* Mobile Search Suggestions */}
            {showSearchSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-80 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      navigate(`/product/${product.id}`);
                      setShowSearchSuggestions(false);
                      setSearchQuery('');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 border-b border-gray-50 last:border-none transition-colors"
                  >
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                      <img src={product.image || 'https://placehold.co/100x100/EEE/999?text=Product'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{product.category_name || 'Product'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <div className="lg:hidden fixed top-0 right-0 bottom-0 w-72 sm:w-80 bg-white shadow-2xl z-50 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center gap-2">
                  <img src="/logo-avata.jpeg" alt="AVATA" className="h-10 w-10 rounded-lg" />
                  <span className="text-white font-bold text-lg">Menu</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white p-1">
                  <X size={24} />
                </button>
              </div>

              {/* User Info */}
              {isAuthenticated && user ? (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
              ) : (
                <div className="p-4 border-b border-gray-200">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    Login / Register
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="py-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  <ChevronRight size={18} />
                  Home
                </Link>
                
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors border-t border-gray-100"
                >
                  <ChevronRight size={18} />
                  All Products
                </Link>

                <Link
                  to="/advertisement"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors border-t border-gray-100"
                >
                  <ChevronRight size={18} />
                  Advertisement
                </Link>

                {/* Categories in Mobile Menu */}
                {rootCategories.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Categories
                    </div>
                    {rootCategories.map((cat) => {
                      const renderMobileNode = (node, depth = 0) => {
                        const children = getSubcategories(node.id);
                        const expanded = !!expandedCategoryIds[node.id];
                        const isRoot = depth === 0;
                        const btnClass = isRoot
                          ? 'flex-1 text-left px-4 py-2.5 hover:bg-blue-50 text-gray-700 hover:text-blue-600 text-sm font-semibold transition-colors'
                          : 'product-subcategory-item flex-1 text-left px-3 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600 text-xs font-medium transition-colors';
                        return (
                          <div key={node.id} className="border-b border-gray-50">
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => handleCategoryNavigate(node)}
                                className={btnClass}
                                style={{ paddingLeft: `${16 + depth * 14}px` }}
                              >
                                {node.name}
                              </button>
                              {children.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleCategoryExpanded(node.id)}
                                  className="px-3 py-2 text-gray-400 hover:text-blue-600"
                                  aria-label={expanded ? 'Collapse subcategories' : 'Expand subcategories'}
                                >
                                  <ChevronRight size={15} className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
                                </button>
                              )}
                            </div>
                            {expanded && children.length > 0 && (
                              <div>{children.map((child) => renderMobileNode(child, depth + 1))}</div>
                            )}
                          </div>
                        );
                      };

                      return renderMobileNode(cat, 0);
                    })}
                  </div>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (window.location.pathname !== '/') {
                      navigate('/');
                      setTimeout(() => {
                        const offerSection = document.getElementById('special-offers-section');
                        if (offerSection) offerSection.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      const offerSection = document.getElementById('special-offers-section');
                      if (offerSection) offerSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors border-t border-gray-100"
                >
                  <ChevronRight size={18} />
                  Special Offers
                </button>

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors border-t border-gray-100"
                >
                  <ChevronRight size={18} />
                  Contact Us
                </Link>

                {isAuthenticated && user && (
                  <>
                    <Link
                      to="/my-account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors border-t border-gray-100"
                    >
                      <Package size={18} />
                      My Account Orders
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                        setTimeout(() => {
                          window.location.replace('/');
                        }, 100);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-medium transition-colors border-t-2 border-red-200"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </header>
      <LoginRegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Header;
