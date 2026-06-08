import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Film, Image as ImageIcon, PlusCircle, Trash2, Upload } from 'lucide-react';
import getFullImageUrl from '../utils/getFullImageUrl';

const AdvertisementManager = ({ darkMode = false, onNotify }) => {
  const [advertisement, setAdvertisement] = useState({ items: [], itemsWithUrls: [] });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const notify = (message, type = 'success') => {
    if (typeof onNotify === 'function') {
      onNotify(message, type);
      return;
    }
    window.alert(message);
  };

  const items = useMemo(() => {
    const fromApi = Array.isArray(advertisement.itemsWithUrls) ? advertisement.itemsWithUrls : [];
    if (fromApi.length > 0) return fromApi;
    const fallback = Array.isArray(advertisement.items) ? advertisement.items : [];
    return fallback.map((item) => ({ ...item, mediaUrl: getFullImageUrl(item.media || '') }));
  }, [advertisement]);

  const loadAdvertisement = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/advertisement');
      const data = await response.json();
      setAdvertisement(data?.success ? (data.advertisement || { items: [], itemsWithUrls: [] }) : { items: [], itemsWithUrls: [] });
    } catch (error) {
      console.error('Failed to load advertisement:', error);
      setAdvertisement({ items: [], itemsWithUrls: [] });
    }
  };

  useEffect(() => {
    loadAdvertisement();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!mediaFile) {
      notify('Choose an image or video file first.', 'warning');
      return;
    }
    if (mediaType === 'image' && !mediaFile.type.startsWith('image/')) {
      notify('Selected file is not an image.', 'error');
      return;
    }
    if (mediaType === 'video' && !mediaFile.type.startsWith('video/')) {
      notify('Selected file is not a video.', 'error');
      return;
    }
    if (mediaFile.size > 80 * 1024 * 1024) {
      notify('Media must be 80MB or smaller.', 'error');
      return;
    }

    setUploading(true);
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 120000);
      const payload = new FormData();
      payload.append('ad_media', mediaFile);
      payload.append('mediaType', mediaType);
      payload.append('title', title);
      payload.append('description', description);
      const response = await fetch('http://localhost:5000/api/advertisement/items', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: payload,
        signal: controller.signal
      });
      if (timeoutId) clearTimeout(timeoutId);

      let data = null;
      try {
        data = await response.json();
      } catch (_e) {
        data = { success: false, message: 'Server returned an invalid response.' };
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload advertisement media');
      }
      setMediaFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTitle('');
      setDescription('');
      setAdvertisement(data.advertisement || { items: [], itemsWithUrls: [] });
      notify('Advertisement media added successfully.', 'success');
    } catch (error) {
      console.error('Failed to upload advertisement media:', error);
      notify(error.name === 'AbortError' ? 'Upload timed out. Please try a smaller file or better network.' : (error.message || 'Failed to upload advertisement media.'), 'error');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Remove this advertisement item?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/advertisement/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove advertisement item');
      }
      setAdvertisement(data.advertisement || { items: [], itemsWithUrls: [] });
      notify('Advertisement item removed.', 'success');
    } catch (error) {
      console.error('Failed to remove advertisement item:', error);
      notify(error.message || 'Failed to remove advertisement item.', 'error');
    }
  };

  const handleToggleVisible = async (id, nextVisible) => {
    try {
      const response = await fetch(`http://localhost:5000/api/advertisement/items/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visible: nextVisible })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update visibility');
      }
      setAdvertisement(data.advertisement || { items: [], itemsWithUrls: [] });
      notify(nextVisible ? 'Advert item is now visible.' : 'Advert item is now hidden.', 'success');
    } catch (error) {
      console.error('Failed to toggle advertisement visibility:', error);
      notify(error.message || 'Failed to update advert visibility.', 'error');
    }
  };

  const handleMoveItem = async (id, direction) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    const itemIds = reordered.map((item) => item.id);

    try {
      const response = await fetch('http://localhost:5000/api/advertisement/items/reorder', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemIds })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reorder items');
      }
      setAdvertisement(data.advertisement || { items: [], itemsWithUrls: [] });
    } catch (error) {
      console.error('Failed to reorder advertisement items:', error);
      notify(error.message || 'Failed to reorder advert items.', 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Remove all advertisement media items?')) return;
    try {
      const response = await fetch('http://localhost:5000/api/advertisement', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to clear advertisement');
      }
      setAdvertisement(data.advertisement || { items: [], itemsWithUrls: [] });
      notify('All advertisement media removed.', 'success');
    } catch (error) {
      console.error('Failed to clear advertisement media:', error);
      notify(error.message || 'Failed to clear advertisement media.', 'error');
    }
  };

  const shellClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <ImageIcon className="text-blue-600 w-8 h-8" />
          Advertisement Studio
        </h2>
        <p className="text-gray-500 font-medium">Upload multiple images and videos for a richer public advertisement page.</p>
      </div>

      <form onSubmit={handleUpload} className={`${shellClass} rounded-2xl border p-6 shadow-sm space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMediaType('image')}
            className={`rounded-xl border px-4 py-3 font-bold flex items-center justify-center gap-2 ${mediaType === 'image' ? 'border-blue-600 bg-blue-50 text-blue-700' : (darkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700')}`}
          >
            <ImageIcon className="w-4 h-4" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setMediaType('video')}
            className={`rounded-xl border px-4 py-3 font-bold flex items-center justify-center gap-2 ${mediaType === 'video' ? 'border-blue-600 bg-blue-50 text-blue-700' : (darkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700')}`}
          >
            <Film className="w-4 h-4" />
            Video
          </button>
        </div>

        <label className={`flex items-center gap-3 border rounded-xl px-4 py-4 cursor-pointer ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
          <Upload className="w-5 h-5" />
          <span className="font-semibold">{mediaFile ? mediaFile.name : `Choose an advertisement ${mediaType}`}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={mediaType === 'video'
              ? '.mp4,.webm,.mov,.avi,.mkv,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska'
              : '.jpg,.jpeg,.jfif,.png,.webp,.gif,.heic,.heif,image/*'}
            className="hidden"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline (optional)"
            className={`w-full rounded-xl border px-4 py-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className={`w-full rounded-xl border px-4 py-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
          />
        </div>

        <p className="text-xs text-gray-500">Accepted images: JPG, JPEG, JFIF, PNG, WEBP, GIF, HEIC, HEIF. Accepted videos: MP4, WEBM, MOV, AVI, MKV. Maximum file size: 80MB.</p>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-60">
            <PlusCircle className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Add Media Item'}
          </button>
          {items.length > 0 && (
            <button type="button" onClick={handleDeleteAll} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700">
              <Trash2 className="w-4 h-4" />
              Remove All
            </button>
          )}
        </div>
      </form>

      <div className={`${shellClass} rounded-2xl border p-6 shadow-sm space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black">Current Media Library</h3>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, index) => (
              <div key={item.id} className={`rounded-2xl overflow-hidden border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <div className="aspect-video bg-black">
                  {item.type === 'video' ? (
                    <video src={item.mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title || 'Advertisement'} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${item.type === 'video' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.type === 'video' ? 'Video' : 'Image'}
                      </span>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.visible === false ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.visible === false ? 'Hidden' : 'Visible'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(item.id, 'up')}
                        disabled={index === 0}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-40"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(item.id, 'down')}
                        disabled={index === items.length - 1}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-40"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(item.id, item.visible === false)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-700"
                        title={item.visible === false ? 'Show item' : 'Hide item'}
                      >
                        {item.visible === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                  {item.title && <p className="font-black text-base leading-snug">{item.title}</p>}
                  {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            No advertisement media uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementManager;