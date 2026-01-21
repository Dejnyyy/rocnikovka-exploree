"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

// Cloudinary helper (same as in explore.tsx)
function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}
function isCloudinaryUrl(url: string) {
  return /res\.cloudinary\.com\//.test(url);
}
function toCloudinaryUrl(idOrUrl: string, width = 1080) {
  if (isAbsoluteUrl(idOrUrl)) {
    return isCloudinaryUrl(idOrUrl)
      ? idOrUrl.replace("/upload/", `/upload/f_auto,q_auto,w_${width},dpr_2.0/`)
      : idOrUrl;
  }
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return idOrUrl;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto:good,w_${width},dpr_2.0/${idOrUrl}`;
}

export type PinCardProps = {
  id: string;
  slug: string;
  title?: string | null;
  mediaUrl: string; // coverUrl or image
  location?: string | null; // city, country
  city?: string | null;
  country?: string | null;
};

export function PinCard({
  id,
  slug,
  title,
  mediaUrl,
  location,
  city,
  country,
}: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayLocation =
    location ||
    (city || country ? [city, country].filter(Boolean).join(", ") : null);
  const displayTitle = title || "Untitled";

  return (
    <Link
      href={`/spot/${slug || id}`}
      className="mb-5 break-inside-avoid overflow-hidden rounded-2xl relative cursor-pointer block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={toCloudinaryUrl(mediaUrl, 1100)}
        alt={displayTitle}
        className="block w-full h-auto rounded-2xl"
        loading="lazy"
      />
      {(displayTitle !== "Untitled" || displayLocation) && (
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          <div className="flex items-stretch gap-3">
            {/* Desktop: animated line */}
            <motion.div
              className="hidden md:block w-0.5 bg-white rounded-full flex-shrink-0 self-stretch"
              initial={false}
              animate={{ width: isHovered ? "0.25rem" : "0.125rem" }}
            />
            {/* Mobile: static line */}
            <div className="md:hidden w-1 bg-white rounded-full flex-shrink-0 self-stretch" />

            <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
              {/* Desktop: animated text */}
              <motion.div
                className="hidden md:block"
                initial={false}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  x: isHovered ? "0%" : "-100%",
                }}
                transition={{
                  duration: isHovered ? 0.3 : 1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {displayTitle !== "Untitled" && (
                  <h3 className="mb-1 font-semibold text-sm text-white whitespace-nowrap">
                    {displayTitle}
                  </h3>
                )}
                {displayLocation && (
                  <p className="text-xs text-white/80 whitespace-nowrap">
                    {displayLocation}
                  </p>
                )}
              </motion.div>
              {/* Mobile: always visible text */}
              <div className="md:hidden">
                {displayTitle !== "Untitled" && (
                  <h3 className="mb-1 font-semibold text-sm text-white whitespace-nowrap">
                    {displayTitle}
                  </h3>
                )}
                {displayLocation && (
                  <p className="text-xs text-white/80 whitespace-nowrap">
                    {displayLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
