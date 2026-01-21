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

export type CollectionPinCardProps = {
  id: string;
  name: string;
  slug: string | null;
  coverUrl: string | null;
  count: number;
  username: string;
};

export function CollectionPinCard({ id, name, slug, coverUrl, count, username }: CollectionPinCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mediaUrl = coverUrl || "";

  return (
    <Link
      href={`/u/${username}/collections/${slug ?? id}`}
      className="mb-5 break-inside-avoid overflow-hidden rounded-2xl relative cursor-pointer block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {mediaUrl ? (
        <img
          src={toCloudinaryUrl(mediaUrl, 1100)}
          alt={name}
          className="block w-full h-auto rounded-2xl"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl flex items-center justify-center">
          <div className="text-zinc-500 dark:text-zinc-400 text-sm">No cover</div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
        <div className="flex items-stretch gap-3">
          <motion.div
            className="w-0.5 bg-white rounded-full flex-shrink-0 self-stretch"
            animate={{ width: isHovered ? "0.25rem" : "0.125rem" }}
          />
          <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
            <div>
              <h3 className="mb-1 font-semibold text-sm text-white whitespace-nowrap">
                {name}
              </h3>
              <p className="text-xs text-white/80 whitespace-nowrap">
                {count} {count === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

