import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import getFullImageUrl from '../utils/getFullImageUrl';
import Footer from '../components/Footer';
import { Heart, ShoppingCart } from 'lucide-react';
import ProductImageUpload from '../components/ProductImageUpload';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';

const Products = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'HEAD PROTECTION';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('HEAD PROTECTION');
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [category]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedSubcategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      let categoryProducts = response.data;

      if (category !== 'HEAD PROTECTION') {
        categoryProducts = categoryProducts.filter(product =>
          product.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      setProducts(categoryProducts);

      // Extract unique subcategories
      const uniqueSubcategories = [...new Set(categoryProducts.map(product => product.subcategory))];
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (selectedSubcategory !== 'HEAD PROTECTION') {
      filtered = filtered.filter(product => product.subcategory === selectedSubcategory);
    }

    // Sort products
    switch (sortBy) {
      case 'popularity':
        // Assuming popularity is a field, or sort by name for now
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    const result = addToCart(product);
    if (!result?.success) {
      alert(result?.message || `${product.name} is out of stock.`);
      return;
    }
    alert(`${product.name} added to cart!`);
  };

  const handleAddToWishlist = (product) => {
    // TODO: Implement add to wishlist functionality
    console.log('Add to wishlist:', product);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-xl">Loading products...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-4">
          <a href="/" className="hover:text-blue-600">Home</a> / <a href="/products" className="hover:text-blue-600">Shop</a> / <span className="text-gray-900 font-semibold">{category.toUpperCase()}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl font-bold text-black mb-8
">{category.toUpperCase()}</h1>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setSelectedSubcategory('HEAD PROTECTION')}
                className={`px-4 py-2 rounded ${selectedSubcategory === 'HEAD PROTECTION' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                HEAD PROTECTION
              </button>
              {subcategories.map((subcat, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSubcategory(subcat)}
                  className={`px-4 py-2 rounded ${selectedSubcategory === subcat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Sort */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} products
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="popularity">Sort by popularity</option>
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id || index} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No products found in this category.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Products;
