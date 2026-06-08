import React, { useState, useRef } from "react";
import { Maximize, MapPin, X, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const LocationCard = ({ title, image, mapsUrl }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`group relative w-full bg-slate-900 rounded-2xl overflow-hidden shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/80 transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/15 ${
        isFullscreen ? "fixed inset-0 z-[1000] rounded-none ring-0" : "h-40 sm:h-44 md:h-48"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10 pointer-events-none" />

      <div className="absolute top-3 left-3 z-20">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          Store
        </span>
      </div>

      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/45 text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-blue-600 hover:ring-blue-400/50"
          title="Fullscreen"
        >
          {isFullscreen ? <X size={16} strokeWidth={2.25} /> : <Maximize size={16} strokeWidth={2.25} />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold leading-snug text-white drop-shadow-sm line-clamp-2">
              {title}
            </h3>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 transition hover:text-white"
            >
              <span className="border-b border-sky-300/70 pb-px group-hover:border-white">Open in Google Maps</span>
              <ExternalLink size={12} className="shrink-0 opacity-90" aria-hidden />
            </a>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/25">
            <MapPin size={20} className="text-red-400 drop-shadow-md" strokeWidth={2.25} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ShopLocationCard() {
  return (
    <section
      className="relative w-full overflow-hidden py-14 sm:py-16 font-poppins"
      aria-labelledby="shop-locations-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="relative container mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">Our shops</p>
          <h2
            id="shop-locations-heading"
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
          >
            Our store locations
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Visit AVATA Trading in person — tap a card to open directions on Google Maps.
          </p>
          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 shadow-sm shadow-blue-500/30" />
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          <LocationCard
            title="AVATA Trading (Main shop)"
            image="https://lh3.googleusercontent.com/p/AF1QipNs_SQ_EoYNmP530k91gRJWDRirokRyfYPNzk0-=w1000-h600-k-no"
            mapsUrl="https://maps.app.goo.gl/vtjq5iswu8k1MpKx9"
          />
          <LocationCard
            title="AVATA Trading (Branch shop)"
            image="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&h=600&fit=crop&q=80"
            mapsUrl="https://maps.app.goo.gl/vtjq5iswu8k1MpKx9"
          />
        </div>
      </div>
    </section>
  );
}
