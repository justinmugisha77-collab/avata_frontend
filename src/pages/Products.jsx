import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'all';
  const categoryId = Number(searchParams.get('categoryId') || 0);
  const subcategory = searchParams.get('subcategory') || '';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(true);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const getChildCategories = (parentId) => categories.filter((cat) => Number(cat.parent_id) === Number(parentId));

  const getDefaultExpandedCategoryId = () => {
    if (categoryId > 0) {
      // Expand the direct parent of the selected category (if it has one)
      const selected = categories.find((c) => Number(c.id) === Number(categoryId));
      if (selected?.parent_id) return Number(selected.parent_id);
      return Number(categoryId);
    }
    return null;
  };


  const getCategoryPath = (catId) => {
    const path = [];
    let current = categories.find((cat) => Number(cat.id) === Number(catId));
    const visited = new Set();

    while (current) {
      const currentId = Number(current.id);
      if (visited.has(currentId)) break;
      visited.add(currentId);
      path.unshift(current);
      if (!current.parent_id) break;
      current = categories.find((cat) => Number(cat.id) === Number(current.parent_id));
    }

    return path;
  };

  const getDescendantCategoryIds = (parentId) => {
    const root = Number(parentId);
    if (!Number.isFinite(root) || root <= 0) return [];
    const descendants = new Set([root]);
    const queue = [root];
    while (queue.length > 0) {
      const current = queue.shift();
      getChildCategories(current).forEach((child) => {
        const childId = Number(child.id);
        if (!descendants.has(childId)) {
          descendants.add(childId);
          queue.push(childId);
        }
      });
    }
    return [...descendants];
  };

  const selectedCategoryById = categories.find((cat) => Number(cat.id) === categoryId) || null;

  // Fetch real categories from the database
  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    // Scroll to top when component mounts or search params change
    window.scrollTo(0, 0);
  }, [searchParams]);

  useEffect(() => {
    // Auto-expand relevant category/subcategory section when landing on a selected categoryId
    const nextExpanded = getDefaultExpandedCategoryId();
    if (nextExpanded) setExpandedCategoryId(nextExpanded);
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategory, categoryId, categories]);


  useEffect(() => {
    filterAndSortProducts();
  }, [products, sortBy, searchParams]);

  const getSortStamp = (product) => {
    const fromDate = new Date(product?.created_at || product?.createdAt || '').getTime();
    if (Number.isFinite(fromDate) && fromDate > 0) return fromDate;
    const fromId = Number(product?.id || 0);
    return Number.isFinite(fromId) ? fromId : 0;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      let categoryProducts = response.data;

      if (categoryId > 0) {
        const allowedIds = new Set(getDescendantCategoryIds(categoryId));
        categoryProducts = categoryProducts.filter((product) => {
          const productCategoryId = Number(product.category_id || 0);
          const productSubcategoryId = Number(product.subcategory_id || 0);
          return allowedIds.has(productCategoryId) || allowedIds.has(productSubcategoryId);
        });
      } else if (category !== 'all') {
        const normalizedSearchCategory = category.toLowerCase().replace(/\s+/g, '');
        categoryProducts = categoryProducts.filter(product => {
          const productCategory = product.category || product.category_name || '';
          const normalizedProductCategory = productCategory.toLowerCase().replace(/\s+/g, '');
          return normalizedProductCategory.includes(normalizedSearchCategory) ||
            normalizedSearchCategory.includes(normalizedProductCategory);
        });
      }

      if (subcategory) {
        const normalizedSubcategory = subcategory.toLowerCase().replace(/\s+/g, '');
        categoryProducts = categoryProducts.filter((product) => {
          const productSubcategory = product.subcategory || product.subcategory_name || '';
          const normalizedProductSubcategory = String(productSubcategory).toLowerCase().replace(/\s+/g, '');
          return normalizedProductSubcategory.includes(normalizedSubcategory) || normalizedSubcategory.includes(normalizedProductSubcategory);
        });
      }

      setProducts(categoryProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';
    if (searchTerm) {
      const simplifiedSearch = searchTerm.replace(/[aeiou]/g, '').replace(/[^a-z0-9]/g, '');
      filtered = filtered.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.category_name && product.category_name.toLowerCase().includes(searchTerm)) ||
        (product.subcategory_name && product.subcategory_name.toLowerCase().includes(searchTerm)) ||
        (String(product.name || '').toLowerCase().replace(/[aeiou]/g, '').replace(/[^a-z0-9]/g, '').includes(simplifiedSearch)) ||
        (String(product.category_name || product.category || '').toLowerCase().replace(/[aeiou]/g, '').replace(/[^a-z0-9]/g, '').includes(simplifiedSearch))
      );
    }

    // Sort products
    switch (sortBy) {
      case 'popularity':
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => getSortStamp(b) - getSortStamp(a));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleCategoryClick = (catName) => {
    if (catName === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?category=${encodeURIComponent(catName)}`);
    }
  };

  const handleCategoryIdClick = (catId) => {
    if (!catId) {
      navigate('/products');
      return;
    }
    navigate(`/products?categoryId=${encodeURIComponent(catId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayCategory = selectedCategoryById?.name || (category === 'all' ? 'All Products' : category);
  const topLevelCategories = categories.filter((cat) => !cat.parent_id);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600 transition-colors">Shop</Link>
          {categoryId > 0 && (
            getCategoryPath(categoryId).map((cat, idx) => (
              <React.Fragment key={cat.id}>
                <span>/</span>
                <button
                  onClick={() => handleCategoryIdClick(cat.id)}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-gray-900 font-semibold"
                >
                  {cat.name}
                </button>
              </React.Fragment>
            ))
          )}
          {category !== 'all' && categoryId === 0 && (
            <>
              <span>/</span>
              <span className="text-gray-900 font-semibold">{displayCategory}</span>
            </>
          )}
        </nav>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 text-gray-900">{displayCategory.toUpperCase()}</h1>

        {/* Inline Categories Row with Hover */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-gray-600 mr-1">Categories:</span>
            <button
              type="button"
              onClick={() => handleCategoryIdClick(null)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold max-w-[10rem] truncate border transition-all duration-150 ${!categoryId && category === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}
              aria-label="All Products"
            >
              All Products
            </button>
            {topLevelCategories.map((cat) => {
              const selected = Number(selectedCategoryById?.id) === Number(cat.id);
              const hasSubcategories = getChildCategories(cat.id).length > 0;
              return (
                <div
                  key={cat.id}
                  className="relative"
                  onClick={() => setExpandedCategoryId((prev) => (prev === cat.id ? null : cat.id))}

                >
                  <button
                    type="button"
                    onClick={() => handleCategoryIdClick(cat.id)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold max-w-[10rem] sm:max-w-[11rem] truncate sm:truncate border transition-all duration-150 ${selected
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}
                  >
                    {cat.name} {hasSubcategories && <span className="ml-1">▼</span>}
                  </button>
                  
                  {/* Subcategories Dropdown (always visible on expanded category) */}
                  {hasSubcategories && expandedCategoryId === cat.id && (
                    <div className="absolute top-full left-0 mt-2 w-[min(80vw,16rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {getChildCategories(cat.id).map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => handleCategoryIdClick(subcat.id)}
                          className="product-subcategory-item block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100 last:border-b-0 transition-colors font-medium break-words"
                        >
                          <ChevronRight size={12} className="inline mr-2" />
                          {subcat.name}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Filter and Sort */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-7 md:mb-8">
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> products
            {(category !== 'all' || categoryId > 0) && <span className="ml-1">in <span className="text-blue-600 font-semibold">{displayCategory}</span></span>}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
              >
                <option value="popularity">Popularity</option>
                <option value="newest">Newest Added</option>
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {(() => {
          const isElectrical = String(displayCategory || '').toLowerCase().includes('electrical');
          const gridClass = isElectrical
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6'
            : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6';
          return (
            <div className={gridClass}>
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id || index} product={product} size={isElectrical ? 'small' : 'normal'} />
              ))}
            </div>
          );
        })()}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 sm:py-16 md:py-20 px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🔍</div>
            <p className="text-lg sm:text-xl text-gray-600 font-semibold mb-2">No products found</p>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
              {(category !== 'all' || categoryId > 0)
                ? `No products in the "${displayCategory}" category yet.`
                : 'No products match your search.'}
            </p>
            <button
              onClick={() => handleCategoryClick('all')}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base"
            >
              View All Products
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Products;
