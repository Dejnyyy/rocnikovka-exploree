import Image from "next/image";
import { MapPin } from "lucide-react";

/**
 * Static recreation of the app's map view: a dark (CARTO dark-matter style)
 * world map with pink glowing pins and a spot popup. The real map is always
 * dark regardless of theme, so colours are fixed. Purely visual / forward-
 * looking — the live map screen is not shipped yet.
 *
 * Pin positions are equirectangular: left% = (lng+180)/360, top% = (90-lat)/180.
 */

const PINS = [
  { left: 49.9, top: 21.4 }, // London
  { left: 50.6, top: 22.9, popup: true }, // Paris
  { left: 57.0, top: 29.8 }, // Santorini
  { left: 65.3, top: 36.0 }, // Dubai
  { left: 79.7, top: 38.4 }, // Ha Long
  { left: 77.9, top: 42.4 }, // Bangkok
  { left: 88.8, top: 30.2 }, // Tokyo
  { left: 29.4, top: 27.4 }, // New York
  { left: 38.0, top: 62.7 }, // Rio
  { left: 55.1, top: 68.8 }, // Cape Town
  { left: 92.0, top: 68.8 }, // Sydney
  { left: 43.9, top: 14.4 }, // Reykjavik
];

export function MapMockup() {
  return (
    <div className="relative aspect-[9/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0f]">
      {/* Graticule grid */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "8.33% 16.66%",
        }}
      />

      {/* World landmasses */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/world-landmasses.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-contain opacity-90"
      />

      {/* Pins */}
      {PINS.map((p, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
        >
          <span
            className={`block h-2.5 w-2.5 rounded-full border-2 border-white bg-pink-500 ${
              p.popup ? "animate-pulse" : ""
            }`}
            style={{ boxShadow: "0 0 10px 2px rgba(236,72,153,0.7)" }}
          />
        </div>
      ))}

      {/* Spot popup near the Paris pin */}
      <div
        className="absolute w-[150px] -translate-x-1/2 rounded-2xl border border-pink-500/40 bg-zinc-900/90 p-2 shadow-xl backdrop-blur"
        style={{ left: "50.6%", top: "26%" }}
      >
        <div className="relative h-[80px] w-full overflow-hidden rounded-lg">
          <Image
            src="/landing/photos/paris.jpg"
            alt="Paris"
            fill
            sizes="150px"
            className="object-cover"
          />
        </div>
        <div className="mt-1.5 text-sm font-semibold text-white">Paris</div>
        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <MapPin className="h-3 w-3 shrink-0 text-pink-500" />
          France
        </div>
      </div>
    </div>
  );
}
