import React, { useRef, useState } from 'react';
import axios from 'axios';

const ProductImageUpload = ({ productId, onUpload }) => {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/products/${productId}/upload-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onUpload(response.data.imageUrl);
    } catch (err) {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-2">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-xs"
        onClick={() => fileInputRef.current.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default ProductImageUpload;
