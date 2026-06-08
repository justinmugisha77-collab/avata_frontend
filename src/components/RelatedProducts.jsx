import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

const API = 'http://localhost:5000';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const RelatedProducts = ({ currentProductId, currentCategoryId, currentSubcategoryId, currentCategoryName }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/products`);
        const d = await res.json();
        const list = Array.isArray(d) ? d : (d.products || []);

        const nonCurrent = list.filter((p) => String(p.id) !== String(currentProductId));
        const subcategoryMatches = nonCurrent.filter((p) =>
          currentSubcategoryId && Number(p.subcategory_id) === Number(currentSubcategoryId)
        );
        const categoryMatches = nonCurrent.filter((p) =>
          currentCategoryId && Number(p.category_id) === Number(currentCategoryId)
        );
        const categoryNameMatches = nonCurrent.filter((p) =>
          normalizeText(p.category || p.category_name) === normalizeText(currentCategoryName)
        );

        // Priority: same subcategory -> same category -> same category name -> others.
        const merged = [...subcategoryMatches, ...categoryMatches, ...categoryNameMatches, ...nonCurrent];
        const seen = new Set();
        const related = merged.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        }).slice(0, 8);

        setProducts(related);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [currentProductId, currentCategoryId, currentSubcategoryId, currentCategoryName]);

  if (!products.length) return <p className="text-sm text-gray-500">No suggestions right now.</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">Products from the same category</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products.map(p => (
        <ProductCard key={p.id} product={p} size="small" />
      ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
