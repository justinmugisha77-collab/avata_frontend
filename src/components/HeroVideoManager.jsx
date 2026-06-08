import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Trash2, Upload, Video, Volume2, VolumeX } from 'lucide-react';
import getFullImageUrl from '../utils/getFullImageUrl';

const HeroVideoManager = ({ darkMode = false, onNotify }) => {
  const [heroMedia, setHeroMedia] = useState({ type: 'image', video: '', videoUrl: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewVolume, setPreviewVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const previewVideoRef = useRef(null);

  const notify = (message, type = 'success') => {
    if (typeof onNotify === 'function') {
      onNotify(message, type);
      return;
    }
    window.alert(message);
  };

  const videoSrc = useMemo(() => heroMedia.videoUrl || getFullImageUrl(heroMedia.video || ''), [heroMedia]);

  const loadHeroMedia = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/hero-media');
      const data = await response.json();
      setHeroMedia(data?.success ? (data.media || { type: 'image', video: '', videoUrl: '' }) : { type: 'image', video: '', videoUrl: '' });
    } catch (error) {
      console.error('Failed to load hero media:', error);
      setHeroMedia({ type: 'image', video: '', videoUrl: '' });
    }
  };

  useEffect(() => {
    loadHeroMedia();
  }, []);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;
    video.muted = previewMuted;
    video.volume = previewVolume;
    video.playbackRate = playbackRate;
  }, [previewMuted, previewVolume, playbackRate, videoSrc]);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    video.pause();
  }, [isPlaying, videoSrc]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!videoFile) {
      notify('Choose a video file first.', 'warning');
      return;
    }
    if (videoFile.size > 100 * 1024 * 1024) {
      notify('Video must be 100MB or smaller.', 'error');
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('hero_video', videoFile);
      const response = await fetch('http://localhost:5000/api/hero-media', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: payload
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload hero video');
      }
      setVideoFile(null);
      setHeroMedia(data.media || { type: 'image', video: '', videoUrl: '' });
      notify('Homepage hero video updated successfully.', 'success');
    } catch (error) {
      console.error('Failed to upload hero video:', error);
      notify(error.message || 'Failed to upload hero video.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove the homepage hero video?')) return;
    try {
      const response = await fetch('http://localhost:5000/api/hero-media', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove hero video');
      }
      setHeroMedia(data.media || { type: 'image', video: '', videoUrl: '' });
      notify('Homepage hero video removed.', 'success');
    } catch (error) {
      console.error('Failed to remove hero video:', error);
      notify(error.message || 'Failed to remove hero video.', 'error');
    }
  };

  const shellClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900';

  const bumpSpeed = (delta) => {
    setPlaybackRate((prev) => {
      const next = Math.max(0.25, Math.min(2, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Video className="text-blue-600 w-8 h-8" />
          Home Hero Video
        </h2>
        <p className="text-gray-500 font-medium">Admin-only control for the homepage hero video. Upload up to 100MB. Any browser-supported video extension is accepted.</p>
      </div>

      <form onSubmit={handleUpload} className={`${shellClass} rounded-2xl border p-6 shadow-sm space-y-4`}>
        <label className={`flex items-center gap-3 border rounded-xl px-4 py-4 cursor-pointer ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
          <Upload className="w-5 h-5" />
          <span className="font-semibold">{videoFile ? videoFile.name : 'Choose a hero video file'}</span>
          <input type="file" accept=".mp4,.webm,.mov,.avi,.mkv,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
        </label>
        <p className="text-xs text-gray-500">Supported formats: MP4, WEBM, MOV, AVI, MKV. Maximum size: 100MB. The home page will only show mute/unmute control to visitors.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-60">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload / Replace Video'}
          </button>
          {heroMedia.type === 'video' && heroMedia.video && (
            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700">
              <Trash2 className="w-4 h-4" />
              Remove Video
            </button>
          )}
        </div>
      </form>

      <div className={`${shellClass} rounded-2xl border p-6 shadow-sm space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black">Current Preview</h3>
          {heroMedia.type === 'video' && heroMedia.video && (
            <button type="button" onClick={() => setPreviewMuted((prev) => !prev)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-sm font-bold hover:bg-gray-50 text-gray-700">
              {previewMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {previewMuted ? 'Unmute Preview' : 'Mute Preview'}
            </button>
          )}
        </div>
        {heroMedia.type === 'video' && heroMedia.video ? (
          <>
            <video
              ref={previewVideoRef}
              key={videoSrc}
              src={videoSrc}
              className="w-full max-h-[420px] rounded-2xl object-cover bg-black"
              autoPlay
              loop
              playsInline
              controls
              muted={previewMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            <div className={`rounded-xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} space-y-3`}>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Preview Controls (Play/Pause, Speed, Volume)
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  type="button"
                  onClick={() => bumpSpeed(-0.25)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold hover:bg-gray-100 text-gray-700"
                >
                  Speed -
                </button>

                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 bg-white"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={1.75}>1.75x</option>
                  <option value={2}>2x</option>
                </select>

                <button
                  type="button"
                  onClick={() => bumpSpeed(0.25)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold hover:bg-gray-100 text-gray-700"
                >
                  Speed +
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={previewVolume}
                  onChange={(e) => {
                    const nextVolume = Number(e.target.value);
                    setPreviewVolume(nextVolume);
                    if (nextVolume > 0 && previewMuted) setPreviewMuted(false);
                  }}
                  className="w-44"
                />
                <span className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{Math.round(previewVolume * 100)}%</span>
              </div>
            </div>
          </>
        ) : (
          <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            No custom hero video uploaded. The homepage will continue using its fallback image background.
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroVideoManager;