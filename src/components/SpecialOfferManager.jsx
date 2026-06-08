import React, { useEffect, useState } from 'react';
import { Edit3, Percent, Save, Trash2, Upload, X } from 'lucide-react';
import getFullImageUrl from '../utils/getFullImageUrl';

const emptyForm = {
  name: '',
  category: '',
  originalPrice: '',
  currentPrice: '',
  stock: '100',
  linkedProductId: '',
  image: '',
  imageFile: null
};

const SpecialOfferManager = ({ darkMode = false, onNotify }) => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => {
    if (typeof onNotify === 'function') {
      onNotify(message, type);
      return;
    }
    window.alert(message);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingOffer(null);
  };

  const loadOffers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/special-offers');
      const data = await response.json();
      setOffers(data?.success && Array.isArray(data.offers) ? data.offers : []);
    } catch (error) {
      console.error('Failed to load special offers:', error);
      setOffers([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load products for linking:', error);
      setProducts([]);
    }
  };

  useEffect(() => {
    loadOffers();
    loadProducts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const method = editingOffer ? 'PUT' : 'POST';
      const url = editingOffer
        ? `http://localhost:5000/api/special-offers/${editingOffer.id}`
        : 'http://localhost:5000/api/special-offers';

      let response;
      if (form.imageFile) {
        const payload = new FormData();
        payload.append('image_file', form.imageFile);
        payload.append('name', form.name);
        payload.append('category', form.category);
        payload.append('originalPrice', form.originalPrice);
        payload.append('currentPrice', form.currentPrice);
        payload.append('stock', form.stock);
        payload.append('linkedProductId', form.linkedProductId || '');
        response = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: payload
        });
      } else {
        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            originalPrice: form.originalPrice,
            currentPrice: form.currentPrice,
            stock: form.stock,
            linkedProductId: form.linkedProductId || null,
            image_url: form.image
          })
        });
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save special offer');
      }

      notify(editingOffer ? 'Special offer updated successfully.' : 'Special offer created successfully.', 'success');
      resetForm();
      await loadOffers();
    } catch (error) {
      console.error('Failed to save special offer:', error);
      notify(error.message || 'Failed to save special offer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    const linkedProductId = offer.linkedProductId || offer.linked_product_id || offer.productId || offer.product_id || '';
    setForm({
      name: offer.name || '',
      category: offer.category || '',
      originalPrice: offer.originalPrice || '',
      currentPrice: offer.currentPrice || '',
      stock: String(offer.stock ?? 100),
      linkedProductId,
      image: offer.image || '',
      imageFile: null
    });
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Delete this special offer?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/special-offers/${offerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete special offer');
      }
      notify('Special offer deleted successfully.', 'success');
      if (editingOffer && String(editingOffer.id) === String(offerId)) {
        resetForm();
      }
      await loadOffers();
    } catch (error) {
      console.error('Failed to delete special offer:', error);
      notify(error.message || 'Failed to delete special offer.', 'error');
    }
  };

  const shellClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900';
  const inputClass = darkMode
    ? 'w-full border border-gray-700 bg-gray-900 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500'
    : 'w-full border border-gray-200 bg-white text-gray-900 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Percent className="text-orange-600 w-8 h-8" />
          Special Offers
        </h2>
        <p className="text-gray-500 font-medium">Create, edit, and remove special offers shown on the home page.</p>
      </div>

      <form onSubmit={handleSubmit} className={`${shellClass} rounded-2xl border p-6 shadow-sm space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black">{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h3>
          {editingOffer && (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold hover:bg-gray-50 text-gray-700">
              <X className="w-4 h-4" />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Offer name" required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className={inputClass} placeholder="Category" required value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
          <input type="number" className={inputClass} placeholder="Original price" required value={form.originalPrice} onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))} />
          <input type="number" className={inputClass} placeholder="Current price" required value={form.currentPrice} onChange={(e) => setForm((prev) => ({ ...prev, currentPrice: e.target.value }))} />
          <input type="number" min="0" className={inputClass} placeholder="Stock quantity" required value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} />
          <select className={inputClass} value={form.linkedProductId} onChange={(e) => setForm((prev) => ({ ...prev, linkedProductId: e.target.value }))}>
            <option value="">Link to product (optional)</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 flex items-center px-1">Linked offer opens that product page directly.</div>
          <div className="md:col-span-2 space-y-2">
            <input className={inputClass} placeholder="Image URL (optional if uploading a file)" value={form.image} onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))} />
            <label className={`flex items-center gap-2 border rounded-xl px-3 py-3 text-sm font-semibold cursor-pointer ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
              <Upload className="w-4 h-4" />
              <span>{form.imageFile ? form.imageFile.name : 'Choose offer image'}</span>
              <input type="file" accept=".jpg,.jpeg,.jfif,.png,.webp,.gif,.heic,.heif,image/*" className="hidden" onChange={(e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))} />
            </label>
          </div>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-black hover:bg-orange-700 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
        </button>
      </form>

      <div className={`${shellClass} rounded-2xl border p-6 shadow-sm`}>
        <h3 className="text-lg font-black mb-4">Current Offers</h3>
        {offers.length === 0 ? (
          <p className="text-gray-500">No special offers added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                <img src={getFullImageUrl(offer.image)} alt={offer.name} className="w-full h-44 object-cover rounded-xl mb-3" />
                <div className="font-black text-lg">{offer.name}</div>
                <div className="text-sm text-gray-500 mb-2">{offer.category}</div>
                <div className="text-xs text-emerald-700 mb-2 font-semibold">Stock: {Number(offer.stock ?? 100)}</div>
                <div className="text-xs text-blue-600 mb-2 font-semibold">{(offer.linkedProductId || offer.linked_product_id || offer.productId || offer.product_id) ? `Linked Product ID: ${offer.linkedProductId || offer.linked_product_id || offer.productId || offer.product_id}` : 'No linked product'}</div>
                <div className="mb-4">
                  <span className="line-through text-gray-400 mr-2">RWF {Number(offer.originalPrice || 0).toLocaleString()}</span>
                  <span className="text-orange-600 font-black">RWF {Number(offer.currentPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleEdit(offer)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(offer.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialOfferManager;