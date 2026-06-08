import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';

const AllProductsGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchProducts();
  }, []);

  const sortedProducts = useMemo(() => {
    const toTime = (item) => {
      const created = item?.created_at || item?.createdAt;
      if (created) {
        const t = new Date(created).getTime();
        if (!Number.isNaN(t)) return t;
      }
      const idNum = Number(item?.id || 0);
      return Number.isFinite(idNum) ? idNum : 0;
    };

    return [...products].sort((a, b) => toTime(b) - toTime(a));
  }, [products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (!products.length) return <div className="text-center py-8">No products available.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sortedProducts.map((product, idx) => (
        <ProductCard key={product.id || idx} product={product} />
      ))}
    </div>
  );
};

export default AllProductsGrid;
