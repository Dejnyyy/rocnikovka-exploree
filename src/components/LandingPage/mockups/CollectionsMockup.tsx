"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * Static recreation of the app's collections grid, matching `PinCard`'s hover
 * animation exactly: a white vertical bar that thickens on hover and a label
 * that slides in from the left + fades (fast 0.3s in, slow 1s out, custom
 * easing). The first tile stays revealed as a hint. Purely visual.
 */

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const COLLECTIONS = [
  { image: "/landing/photos/santorini.jpg", name: "Greek Islands", count: 12 },
  { image: "/landing/photos/mountains.jpg", name: "Mountain Escapes", count: 8 },
  { image: "/landing/photos/halong.jpg", name: "Southeast Asia", count: 23 },
  { image: "/landing/photos/desert.jpg", name: "Desert Roads", count: 5 },
];

function CollectionTile({
  image,
  name,
  count,
  hint = false,
}: {
  image: string;
  name: string;
  count: number;
  hint?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const active = hint || isHovered;

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/2] w-full">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 1024px) 45vw, 230px"
          className="object-cover"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
        <div className="flex items-stretch gap-3">
          <motion.div
            className="w-0.5 flex-shrink-0 self-stretch rounded-full bg-white"
            initial={false}
            animate={{ width: active ? "0.25rem" : "0.125rem" }}
            transition={{ duration: active ? 0.3 : 1, ease: EASE }}
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
            <motion.div
              initial={false}
              animate={{ opacity: active ? 1 : 0, x: active ? "0%" : "-100%" }}
              transition={{ duration: active ? 0.3 : 1, ease: EASE }}
            >
              <h3 className="mb-1 whitespace-nowrap text-sm font-semibold text-white">
                {name}
              </h3>
              <p className="whitespace-nowrap text-xs text-white/80">
                {count} items
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollectionsMockup() {
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
      {COLLECTIONS.map((col, i) => (
        <CollectionTile key={col.name} {...col} hint={i === 0} />
      ))}
    </div>
  );
}
