import React, { useMemo, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const MultipleImageUpload = ({ images, onChange }) => {
  const resolvePreviewUrl = (value) => {
    const raw = typeof value === 'string' ? value : (value?.url || '');
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/uploads')) return `http://localhost:5000${raw}`;
    return raw;
  };

  const normalizePreviews = (input) => {
    if (!Array.isArray(input)) return [];
    return input.map((item) => {
      if (typeof item === 'string') {
        const lower = item.toLowerCase();
        const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv');
        return { url: item, type: isVideo ? 'video' : 'image', source: 'existing' };
      }
      return {
        url: item?.url || '',
        type: item?.type === 'video' ? 'video' : 'image',
        source: item?.source || 'existing'
      };
    }).filter((item) => item.url);
  };

  const serializedImages = useMemo(() => JSON.stringify(images || []), [images]);

  const [previews, setPreviews] = useState(normalizePreviews(images || []));
  const [selectedFiles, setSelectedFiles] = useState([]);

  React.useEffect(() => {
    setPreviews(normalizePreviews(images || []));
    setSelectedFiles([]);
  }, [serializedImages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs
    const validFiles = files.filter((file) => Number(file.size || 0) <= 60 * 1024 * 1024);
    const newPreviews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: String(file.type || '').startsWith('video/') ? 'video' : 'image',
      source: 'new'
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    
    // Store the actual files
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    
    // Notify parent component
    if (onChange) {
      onChange(newFiles);
    }
  };

  const handleRemoveImage = (index) => {
    const target = previews[index];
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);

    if (target?.source !== 'new') return;

    const newFiles = selectedFiles.filter((_, i) => i !== previews.slice(0, index).filter((item) => item.source === 'new').length);
    setSelectedFiles(newFiles);

    if (onChange) {
      onChange(newFiles);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Image Previews */}
        {previews.map((preview, index) => (
          <div key={index} className="relative group">
            <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              {(preview?.type || (typeof preview === 'object' ? 'image' : 'image')) === 'video' ? (
                <video src={resolvePreviewUrl(preview)} className="w-full h-full object-cover" controls muted />
              ) : (
                <img
                  src={resolvePreviewUrl(preview)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition opacity-100 shadow"
              title="Remove"
            >
              <X size={16} />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                Main
              </span>
            )}
          </div>
        ))}

        {/* Upload Button */}
        <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
          <Upload className="text-gray-400 mb-2" size={24} />
          <span className="text-xs text-gray-500 text-center px-2">
            Add Media
          </span>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.jfif,.png,.gif,.webp,.bmp,.svg,.tiff,.heic,.heif,.mp4,.webm,.mov,.avi,.mkv,image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <ImageIcon size={16} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-900">Image Upload Tips:</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
            <li>You can upload multiple files (up to 10)</li>
            <li>Supported formats: images (including jfif) and videos (mp4, webm, mov, avi, mkv)</li>
            <li>Maximum file size: 60MB per file</li>
            <li>First image is used as the main product image when available</li>
          </ul>
        </div>
      </div>

      {/* Image Counter */}
      {previews.length > 0 && (
        <p className="text-sm text-gray-600">
          {previews.length} media file{previews.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default MultipleImageUpload;
