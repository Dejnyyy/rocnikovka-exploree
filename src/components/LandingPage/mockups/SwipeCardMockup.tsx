"use client";

import Image from "next/image";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { MapPin, MessageCircle } from "lucide-react";

/**
 * Presentational recreation of the app's swipe card (`CardFace`/`SwipeDeck`).
 *
 * - `variant="deck"` is interactive: drag to fling left/right exactly like the
 *   real deck, with SAVE/SKIP badges and a blurred card peeking behind. The
 *   three demo cards loop forever. No save/comment/API side-effects.
 * - `variant="single"` is a static single card for the feature section.
 */

type MockSpot = {
  id: string;
  image: string;
  title: string;
  location: string;
  author: string;
  avatar: string;
};

const DEMO: MockSpot[] = [
  {
    id: "d1",
    image: "/landing/photos/dubai.jpg",
    title: "Muzeum budoucnosti",
    location: "Dubai, SAE",
    author: "dejny",
    avatar: "/logos/exploree.png",
  },
  {
    id: "d2",
    image: "/landing/photos/santorini.jpg",
    title: "Santorini",
    location: "Oia, Greece",
    author: "vorlos",
    avatar: "/logos/calmLogo.png",
  },
  {
    id: "d3",
    image: "/landing/photos/halong.jpg",
    title: "Ha Long Bay",
    location: "Quảng Ninh, Vietnam",
    author: "maris",
    avatar: "/logos/frostyLogo.png",
  },
  {
    id: "d4",
    image: "/landing/photos/mountains.jpg",
    title: "Moraine Lake",
    location: "Alberta, Canada",
    author: "zajda",
    avatar: "/logos/calmLogo.png",
  },
];

const SINGLE: MockSpot = DEMO[2];

/* ---------- Card face (shared visual, no interaction) ---------- */
function CardFaceMock({ spot, dim }: { spot: MockSpot; dim?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-sm">
      <Image
        src={spot.image}
        alt={spot.title}
        fill
        sizes="(max-width: 1024px) 90vw, 420px"
        className={`object-cover ${dim ? "opacity-85" : ""}`}
        draggable={false}
        priority
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/85 to-white/0 p-4 dark:from-black dark:to-black/0">
        <div className="mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spot.avatar}
            alt={spot.author}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full bg-white/80 object-cover ring-2 ring-white/30"
          />
          <span className="text-sm font-medium text-zinc-900 drop-shadow-sm dark:text-white">
            {spot.author}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold text-zinc-900 drop-shadow-md dark:text-white">
              {spot.title}
            </div>
            <div className="flex items-center gap-1 truncate text-sm text-zinc-700 drop-shadow-md dark:text-white/90">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {spot.location}
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md">
            <MessageCircle className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Interactive top card (drag to fling) ---------- */
function SwipeableTop({
  spot,
  exitDir,
  onCommit,
}: {
  spot: MockSpot;
  exitDir: "left" | "right";
  onCommit: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-16, 0, 16]);
  const likeOpacity = useTransform(x, [20, 80], [0, 1]);
  const skipOpacity = useTransform(x, [-80, -20], [1, 0]);

  const variants = {
    exit: (dir: "left" | "right") =>
      dir === "right"
        ? { x: 800, rotate: 16, opacity: 0, transition: { duration: 0.28 } }
        : { x: -800, rotate: -16, opacity: 0, transition: { duration: 0.28 } },
  } as const;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const byDistance = Math.abs(info.offset.x) > 90;
    const byVelocity = Math.abs(info.velocity.x) > 500;
    if (byDistance || byVelocity) {
      onCommit(info.offset.x > 0 ? "right" : "left");
    } else {
      x.set(0);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragElastic={0.6}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      custom={exitDir}
      variants={variants}
      exit="exit"
      initial={{ scale: 0.98, y: 8, opacity: 0.6 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
    >
      <CardFaceMock spot={spot} />
      {/* SAVE badge (right) */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 rounded-br-3xl rounded-tl-3xl bg-gradient-to-r from-pink-500 to-yellow-400 p-[2px]"
        style={{ opacity: likeOpacity }}
      >
        <div className="rounded-br-3xl rounded-tl-3xl bg-black/35 px-8 py-2 text-sm font-semibold text-white">
          SAVE
        </div>
      </motion.div>
      {/* SKIP badge (left) */}
      <motion.div
        className="pointer-events-none absolute right-0 top-0 rounded-bl-3xl rounded-tr-3xl bg-gradient-to-r from-pink-500 to-yellow-400 p-[2px]"
        style={{ opacity: skipOpacity }}
      >
        <div className="rounded-bl-3xl rounded-tr-3xl bg-black/35 px-8 py-2 text-sm font-semibold text-white">
          SKIP
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Public component ---------- */
export function SwipeCardMockup({
  variant = "single",
}: {
  variant?: "deck" | "single";
}) {
  const [index, setIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right">("left");

  if (variant === "single") {
    return (
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[320px]">
        <CardFaceMock spot={SINGLE} />
      </div>
    );
  }

  const top = DEMO[index % DEMO.length];
  const next = DEMO[(index + 1) % DEMO.length];

  const commit = (dir: "left" | "right") => {
    setExitDir(dir);
    setIndex((i) => i + 1);
  };

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px]">
      <p className="absolute -top-7 inset-x-0 text-center text-xs text-zinc-400 dark:text-zinc-500">
        ← skip · drag · save →
      </p>
      {/* Card peeking behind, blurred */}
      <div className="absolute inset-0 translate-y-3 scale-[0.96] rotate-[-4deg] opacity-80 blur-[2px]">
        <CardFaceMock spot={next} dim />
      </div>
      {/* Interactive top card */}
      <AnimatePresence initial={false} custom={exitDir}>
        <SwipeableTop key={index} spot={top} exitDir={exitDir} onCommit={commit} />
      </AnimatePresence>
    </div>
  );
}
