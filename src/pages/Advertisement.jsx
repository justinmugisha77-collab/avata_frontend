import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Heart, Search, SlidersHorizontal,
  Volume2, VolumeX, Play, Pause, Eye, X, Tv2, Sparkles, Clock
} from 'lucide-react';
import getFullImageUrl from '../utils/getFullImageUrl';

/* ─────────────────────────────────────────────
   Advertisement page — polished editorial layout
───────────────────────────────────────────── */
const Advertisement = () => {
  const [advertisement, setAdvertisement] = React.useState({ items: [], itemsWithUrls: [] });
  const [activeItemId, setActiveItemId] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('newest');
  const [likedIds, setLikedIds] = React.useState([]);
  const [isPaused, setIsPaused] = React.useState(false);
  const [motionTick, setMotionTick] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxItem, setLightboxItem] = React.useState(null);

  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/advertisement');
        const data = await res.json();
        if (data?.success && data.advertisement) setAdvertisement(data.advertisement);
      } catch (e) { console.error('Failed to load advertisement:', e); }
    };
    load();
  }, []);

  const items = React.useMemo(() => {
    const api = Array.isArray(advertisement.itemsWithUrls) ? advertisement.itemsWithUrls : [];
    if (api.length > 0) return api.filter(i => i?.visible !== false);
    return (Array.isArray(advertisement.items) ? advertisement.items : [])
      .filter(i => i?.visible !== false)
      .map(i => ({ ...i, mediaUrl: getFullImageUrl(i.media || '') }));
  }, [advertisement]);

  const filteredSortedItems = React.useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase();
    const filtered = !term ? [...items] : items.filter(i =>
      [i.type, i.title, i.description].some(s => String(s || '').toLowerCase().includes(term))
    );
    const indexed = filtered.map((i, idx) => ({ ...i, _idx: idx }));
    indexed.sort((a, b) => {
      const aD = new Date(a.createdAt || 0).getTime();
      const bD = new Date(b.createdAt || 0).getTime();
      if (sortBy === 'oldest')     return (aD || a._idx) - (bD || b._idx);
      if (sortBy === 'title_asc')  return String(a.title || '').localeCompare(String(b.title || ''));
      if (sortBy === 'title_desc') return String(b.title || '').localeCompare(String(a.title || ''));
      if (sortBy === 'type')       return String(a.type || '').localeCompare(String(b.type || ''));
      return (bD || b._idx) - (aD || a._idx);
    });
    return indexed.map(({ _idx, ...rest }) => rest);
  }, [items, searchTerm, sortBy]);

  React.useEffect(() => {
    if (!filteredSortedItems.length) { setActiveItemId(''); return; }
    const exists = filteredSortedItems.some(i => String(i.id) === String(activeItemId));
    if (!exists) setActiveItemId(String(filteredSortedItems[0].id || ''));
  }, [filteredSortedItems, activeItemId]);

  const featured = filteredSortedItems.find(i => String(i.id) === String(activeItemId)) || filteredSortedItems[0] || null;
  const currentIndex = filteredSortedItems.findIndex(i => String(i.id) === String(featured?.id));

  const goToByOffset = React.useCallback((offset) => {
    if (!filteredSortedItems.length) return;
    const safe = currentIndex >= 0 ? currentIndex : 0;
    const next = filteredSortedItems[(safe + offset + filteredSortedItems.length) % filteredSortedItems.length];
    if (next) { setActiveItemId(String(next.id || '')); setMotionTick(t => t + 1); }
  }, [currentIndex, filteredSortedItems]);

  React.useEffect(() => {
    if (isPaused || filteredSortedItems.length <= 1) return;
    const t = setInterval(() => goToByOffset(1), 10000);
    return () => clearInterval(t);
  }, [goToByOffset, isPaused, filteredSortedItems.length]);

  const toggleLike = (id) => {
    const nid = String(id || '');
    if (!nid) return;
    setLikedIds(prev => prev.includes(nid) ? prev.filter(x => x !== nid) : [...prev, nid]);
  };

  /* video refs */
  const videoRefs = React.useRef({});
  const featuredVideoRef = React.useRef(null);
  const [mutedMap, setMutedMap] = React.useState({});
  const [pausedMap, setPausedMap] = React.useState({});

  const toggleMute = (id) => {
    const key = String(id || '');
    const ref = videoRefs.current[key];
    if (!ref) return;
    const next = !ref.muted;
    ref.muted = next;
    setMutedMap(s => ({ ...s, [key]: next }));
    if (!next) ref.play?.().catch(() => {});
  };

  const togglePause = (id) => {
    const key = String(id || '');
    const ref = videoRefs.current[key];
    if (!ref) return;
    if (ref.paused) { ref.play?.().catch(() => {}); setPausedMap(s => ({ ...s, [key]: false })); }
    else { ref.pause?.(); setPausedMap(s => ({ ...s, [key]: true })); }
  };

  React.useEffect(() => {
    filteredSortedItems.forEach(it => {
      if (String(it.type) === 'video') {
        const key = String(it.id || it.media || '');
        const ref = videoRefs.current[key];
        if (ref) {
          ref.muted = true; ref.loop = true; ref.playsInline = true;
          ref.play?.().catch(() => {});
          setMutedMap(s => ({ ...s, [key]: true }));
          setPausedMap(s => ({ ...s, [key]: ref.paused }));
        }
      }
    });
  }, [filteredSortedItems]);

  React.useEffect(() => {
    const v = featuredVideoRef.current;
    if (v && featured?.type === 'video') {
      v.muted = true; v.loop = true; v.playsInline = true;
      v.play?.().catch(() => {});
    }
  }, [featured?.id, featured?.mediaUrl]);

  const isLiked = (id) => likedIds.includes(String(id || ''));

  return (
    <div style={styles.page}>

      {/* ── PAGE HEADER ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <span style={styles.eyebrow}>
              <Sparkles size={11} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              AVATA Promotions
            </span>
            <h1 style={styles.pageTitle}>Advertising Journal</h1>
            <p style={styles.pageSub}>Fresh campaign stories, product spotlights, and curated visual showcases.</p>
          </div>
          <Link to="/" style={styles.backBtn}>
            <ChevronLeft size={15} /> Back to Home
          </Link>
        </div>

        {/* filter bar */}
        <div style={styles.filterBar}>
          <div style={styles.searchWrap}>
            <Search size={15} style={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search adverts…"
              style={styles.searchInput}
            />
          </div>
          <div style={styles.sortWrap}>
            <SlidersHorizontal size={15} style={styles.sortIcon} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.sortSelect}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
              <option value="type">Media type</option>
            </select>
          </div>
          <span style={styles.countBadge}>
            {filteredSortedItems.length} advert{filteredSortedItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {featured ? (
        <div style={styles.body}>

          {/* ── LEFT: FEATURED ── */}
          <main style={styles.featuredCol}>

            {/* media panel */}
            <div style={styles.featuredCard}>
              <div key={`fm-${featured.id}-${motionTick}`} style={styles.featuredMedia}>
                {featured.type === 'video' ? (
                  <video
                    ref={featuredVideoRef}
                    src={featured.mediaUrl}
                    controls autoPlay muted loop playsInline
                    style={styles.featuredMediaEl}
                  />
                ) : (
                  <img src={featured.mediaUrl} alt={featured.title} style={styles.featuredMediaEl} />
                )}

                {/* overlay controls */}
                <div style={styles.featuredOverlay}>
                  <div style={styles.overlayLeft}>
                    <span style={styles.slideLabel}>
                      <Clock size={11} style={{ marginRight: 4 }} />
                      Auto-slide · {Math.max(1, currentIndex + 1)} / {filteredSortedItems.length}
                    </span>
                  </div>
                  <div style={styles.overlayRight}>
                    <button style={styles.navBtn} onClick={() => goToByOffset(-1)} aria-label="Previous">
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      style={{ ...styles.navBtn, ...(isPaused ? styles.navBtnActive : {}) }}
                      onClick={() => setIsPaused(p => !p)}
                      aria-label={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button style={styles.navBtn} onClick={() => goToByOffset(1)} aria-label="Next">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* progress dots */}
                {filteredSortedItems.length > 1 && (
                  <div style={styles.dotsRow}>
                    {filteredSortedItems.map((it, i) => (
                      <button
                        key={it.id}
                        onClick={() => setActiveItemId(String(it.id))}
                        style={{
                          ...styles.dot,
                          ...(i === currentIndex ? styles.dotActive : {}),
                        }}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* featured caption */}
              <div key={`fc-${featured.id}-${motionTick}`} style={styles.featuredCaption}>
                <div style={styles.captionTop}>
                  <div>
                    <span style={styles.featuredBadge}>
                      {featured.type === 'video' ? <Tv2 size={11} style={{ marginRight: 4 }} /> : null}
                      Featured {featured.type === 'video' ? 'Video' : 'Advert'}
                    </span>
                    <h2 style={styles.featuredTitle}>{featured.title || 'Selected campaign'}</h2>
                    <p style={styles.featuredDesc}>
                      {featured.description || 'Select any card to switch the focused campaign preview.'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleLike(featured.id)}
                    style={{ ...styles.likeBtn, ...(isLiked(featured.id) ? styles.likeBtnActive : {}) }}
                    aria-label="Like"
                  >
                    <Heart size={15} style={isLiked(featured.id) ? { fill: '#ef4444', color: '#ef4444' } : {}} />
                    {isLiked(featured.id) ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* ── RIGHT: CARDS FEED ── */}
          <aside style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>All Adverts</h3>
              <p style={styles.sidebarSub}>Click a card to preview</p>
            </div>

            <div style={styles.feedList}>
              {filteredSortedItems.map((item, index) => {
                const key = String(item.id || item.media || index);
                const active = String(item.id) === String(featured?.id);
                return (
                  <article
                    key={`card-${item.id || index}`}
                    style={{ ...styles.feedCard, ...(active ? styles.feedCardActive : {}) }}
                  >
                    <button
                      type="button"
                      onClick={() => { setActiveItemId(String(item.id || '')); setMotionTick(t => t + 1); }}
                      style={styles.feedCardBtn}
                    >
                      {/* thumbnail */}
                      <div style={styles.feedThumb}>
                        {item.type === 'video' ? (
                          <video
                            ref={el => { if (el) videoRefs.current[key] = el; else delete videoRefs.current[key]; }}
                            src={item.mediaUrl}
                            muted loop playsInline autoPlay
                            style={styles.feedThumbEl}
                          />
                        ) : (
                          <img src={item.mediaUrl} alt={item.title} style={styles.feedThumbEl} />
                        )}
                        {item.type === 'video' && (
                          <div style={styles.videoControls}>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); toggleMute(key); }}
                              style={styles.videoBtn}
                              aria-label="Toggle mute"
                            >
                              {mutedMap[key] ? <VolumeX size={11} /> : <Volume2 size={11} />}
                            </button>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); togglePause(key); }}
                              style={styles.videoBtn}
                              aria-label="Play/Pause"
                            >
                              {pausedMap[key] ? <Play size={11} /> : <Pause size={11} />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* info */}
                      <div style={styles.feedInfo}>
                        <span style={styles.feedType}>{item.type === 'video' ? 'Video' : 'Image'}</span>
                        <p style={styles.feedTitle}>{item.title || 'Campaign update'}</p>
                        <p style={styles.feedDesc}>{item.description || ''}</p>
                      </div>
                    </button>

                    {/* card actions row */}
                    <div style={styles.cardActions}>
                      <button
                        type="button"
                        onClick={() => toggleLike(item.id)}
                        style={{ ...styles.actionBtn, ...(isLiked(item.id) ? styles.actionBtnLiked : {}) }}
                        aria-label="Like"
                      >
                        <Heart size={12} style={isLiked(item.id) ? { fill: '#ef4444', color: '#ef4444' } : {}} />
                        {isLiked(item.id) ? 'Liked' : 'Like'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLightboxItem(item); setLightboxOpen(true); }}
                        style={styles.actionBtn}
                      >
                        <Eye size={12} /> View full
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Search size={36} style={{ color: '#d1d5db', marginBottom: 12 }} />
          <p style={styles.emptyTitle}>No matching adverts</p>
          <p style={styles.emptyText}>Try a different keyword or clear your search filters.</p>
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && lightboxItem && (
        <div style={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <div style={styles.lightboxBox} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxOpen(false)} style={styles.lightboxClose} aria-label="Close">
              <X size={18} />
            </button>
            <div style={styles.lightboxMedia}>
              {lightboxItem.type === 'video' ? (
                <video src={lightboxItem.mediaUrl} controls style={styles.lightboxMediaEl} />
              ) : (
                <img src={lightboxItem.mediaUrl} alt={lightboxItem.title} style={styles.lightboxMediaEl} />
              )}
            </div>
            <div style={styles.lightboxCaption}>
              <span style={styles.lightboxType}>{lightboxItem.type === 'video' ? 'Video Advert' : 'Image Advert'}</span>
              <h3 style={styles.lightboxTitle}>{lightboxItem.title}</h3>
              {lightboxItem.description && <p style={styles.lightboxDesc}>{lightboxItem.description}</p>}
              <button
                onClick={() => toggleLike(lightboxItem.id)}
                style={{ ...styles.likeBtn, ...(isLiked(lightboxItem.id) ? styles.likeBtnActive : {}), marginTop: 12 }}
              >
                <Heart size={14} style={isLiked(lightboxItem.id) ? { fill: '#ef4444', color: '#ef4444' } : {}} />
                {isLiked(lightboxItem.id) ? 'Liked' : 'Like'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #9ca3af; }
        select option { background: #fff; color: #111; }
        a { text-decoration: none; color: inherit; }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Inline styles object
───────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f6f8',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    color: '#111827',
  },

  /* HEADER */
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  headerInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '20px 24px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#2563eb',
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.15,
  },
  pageSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 1.5,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  filterBar: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '10px 24px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  searchWrap: { position: 'relative', flex: '1 1 220px', maxWidth: 360 },
  searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
  searchInput: {
    width: '100%',
    padding: '8px 10px 8px 32px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    color: '#111827',
    outline: 'none',
  },
  sortWrap: { position: 'relative', flex: '0 0 170px' },
  sortIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
  sortSelect: {
    width: '100%',
    padding: '8px 10px 8px 32px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    color: '#111827',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  countBadge: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
    marginLeft: 'auto',
  },

  /* BODY LAYOUT */
  body: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '24px 24px 48px',
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: 20,
    alignItems: 'start',
  },

  /* FEATURED */
  featuredCol: { display: 'flex', flexDirection: 'column', gap: 0 },
  featuredCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  featuredMedia: {
    position: 'relative',
    background: '#0a0a0a',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    animation: 'fadeSlideUp 0.4s ease',
  },
  featuredMediaEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '40px 16px 14px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  slideLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: 500,
  },
  overlayLeft: {},
  overlayRight: { display: 'flex', gap: 6 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  navBtnActive: {
    background: 'rgba(255,255,255,0.35)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 52,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    background: '#fff',
  },
  featuredCaption: {
    padding: '18px 20px 20px',
    animation: 'fadeSlideUp 0.4s ease',
  },
  captionTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  featuredBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#2563eb',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    padding: '3px 8px',
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    margin: 0,
  },
  featuredDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 1.6,
  },
  likeBtn: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  likeBtnActive: {
    background: '#fff1f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
  },

  /* SIDEBAR */
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto',
    position: 'sticky',
    top: 120,
    paddingRight: 2,
  },
  sidebarHeader: {
    paddingBottom: 4,
    borderBottom: '1px solid #f3f4f6',
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
    color: '#111827',
  },
  sidebarSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  feedList: { display: 'flex', flexDirection: 'column', gap: 8 },
  feedCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
  },
  feedCardActive: {
    border: '1.5px solid #3b82f6',
    boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
  },
  feedCardBtn: {
    display: 'flex',
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },
  feedThumb: {
    width: 88,
    minWidth: 88,
    aspectRatio: '4/3',
    background: '#0a0a0a',
    overflow: 'hidden',
    position: 'relative',
  },
  feedThumbEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  videoControls: {
    position: 'absolute',
    top: 4,
    right: 4,
    display: 'flex',
    gap: 3,
  },
  videoBtn: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.55)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  feedInfo: {
    flex: 1,
    padding: '8px 10px 8px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  feedType: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#2563eb',
  },
  feedTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    lineHeight: 1.35,
    margin: 0,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  feedDesc: {
    fontSize: 11,
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
  },
  cardActions: {
    display: 'flex',
    gap: 6,
    padding: '6px 10px 8px',
    borderTop: '1px solid #f3f4f6',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.12s',
  },
  actionBtnLiked: {
    background: '#fff1f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
  },

  /* EMPTY */
  emptyState: {
    maxWidth: 1280,
    margin: '40px auto',
    padding: '80px 24px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, margin: '0 0 6px' },
  emptyText: { fontSize: 13, color: '#6b7280' },

  /* LIGHTBOX */
  lightboxOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lightboxBox: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 860,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  lightboxClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  lightboxMedia: {
    background: '#0a0a0a',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: '65vh',
  },
  lightboxMediaEl: {
    maxWidth: '100%',
    maxHeight: '65vh',
    objectFit: 'contain',
    display: 'block',
  },
  lightboxCaption: {
    padding: '16px 20px 20px',
    borderTop: '1px solid #f3f4f6',
  },
  lightboxType: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#2563eb',
  },
  lightboxTitle: {
    fontSize: 17,
    fontWeight: 700,
    margin: '6px 0 0',
    letterSpacing: '-0.01em',
  },
  lightboxDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 1.6,
  },
};

export default Advertisement;