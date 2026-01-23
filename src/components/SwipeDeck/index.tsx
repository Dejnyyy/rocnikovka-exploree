"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useDragControls,
} from "framer-motion";
import {
  SaveBurst,
  SaveToCollectionSheet,
  SaveIntentToast,
} from "@/components/SaveToCollectionSheet";
import Image from "next/image";

/* ================= Cloudinary helpers ================= */
function isAbsoluteUrl(url?: string) {
  return !!url && /^https?:\/\//i.test(url);
}
function isCloudinaryUrl(url?: string) {
  return !!url && /res\.cloudinary\.com\//.test(url);
}
/** Injects Cloudinary transform: f_auto,q_auto,c_fill,g_auto,dpr_<dpr>,w_<w> */
function toCloudinaryUrl(idOrUrl: string, width = 900, dpr = 2) {
  if (!idOrUrl) return idOrUrl;
  if (isAbsoluteUrl(idOrUrl)) {
    if (!isCloudinaryUrl(idOrUrl)) return idOrUrl;
    try {
      const u = new URL(idOrUrl);
      const parts = u.pathname.split("/upload/");
      if (parts.length !== 2) return idOrUrl;
      const t = `f_auto,q_auto,c_fill,g_auto,dpr_${Math.max(
        1,
        Math.round(dpr),
      )},w_${Math.round(width)}`;
      u.pathname = `${parts[0]}/upload/${t}/${parts[1]}`;
      return u.toString();
    } catch {
      return idOrUrl;
    }
  }
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return idOrUrl;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_fill,g_auto,dpr_${Math.max(
    1,
    Math.round(dpr),
  )},w_${Math.round(width)}/${idOrUrl}`;
}

/* ================= Types ================= */
export type Spot = {
  id: string;
  title: string;
  coverUrl?: string;
  city?: string;
  country?: string;
  author?: {
    name: string;
    image?: string | null;
    username?: string | null;
  } | null;
};

type SwipeDeckProps = {
  spots: Spot[];
  onSave: (s: Spot) => Promise<void> | void; // right
  onSkip: (s: Spot) => Promise<void> | void; // left
  onEmpty?: () => void;
  className?: string;
};

export function SwipeDeck({
  spots,
  onSave,
  onSkip,
  onEmpty,
  className,
}: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const exitDirRef = useRef<"left" | "right" | null>(null);
  const exitingSpotIdRef = useRef<string | null>(null);
  const spotExitDirRef = useRef<Map<string, "left" | "right">>(new Map());

  // UI: confirmation toast + sheet + success burst
  const [showBurst, setShowBurst] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedSpot, setPickedSpot] = useState<Spot | null>(null);
  const [intentSpot, setIntentSpot] = useState<Spot | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cardTilt, setCardTilt] = useState(0);

  const top = spots[index];
  const next = spots[index + 1];
  const prevTopRef = useRef<Spot | null>(null);

  // Update previous top when top changes
  useEffect(() => {
    if (top) {
      prevTopRef.current = top;
    }
  }, [top?.id]); // Only update when the spot ID changes

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!next?.coverUrl) return;
    const dpr = window.devicePixelRatio || 1;
    const approxCardW = Math.min(window.innerWidth * 0.92, 420);
    const targetW = Math.max(720, approxCardW * dpr * 1.25);
    const url = toCloudinaryUrl(next.coverUrl, targetW, dpr);
    const img = new window.Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
  }, [next?.coverUrl]);

  // Notify when empty
  useEffect(() => {
    if (index >= spots.length && onEmpty) onEmpty();
  }, [index, spots.length, onEmpty]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!top) return;
      if (e.key === "ArrowRight") fling("right");
      if (e.key === "ArrowLeft") fling("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [top]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = async (dir: "left" | "right", spot: Spot) => {
    // Store the direction and spot ID BEFORE updating index
    // This ensures the exiting card gets the correct direction
    exitDirRef.current = dir;
    exitingSpotIdRef.current = spot.id;
    spotExitDirRef.current.set(spot.id, dir); // Store in Map for reliable lookup
    setExitDir(dir);
    // Use a callback to ensure we capture the current spot before index changes
    setIndex((i) => {
      // The spot that's exiting is the one at the current index
      return i + 1;
    });

    if (dir === "right") {
      Promise.resolve(onSave(spot)).catch(() => {});

      setPickedSpot(spot);
      setIntentSpot(spot);
    } else {
      Promise.resolve(onSkip(spot)).catch(() => {});
    }

    setTimeout(() => {
      setExitDir(null);
      exitDirRef.current = null;
      exitingSpotIdRef.current = null;
      spotExitDirRef.current.delete(spot.id); // Clean up
    }, 320);
  };

  const fling = (dir: "left" | "right") => {
    if (!top) return;
    void commit(dir, top);
  };

  if (!top) return null;

  return (
    <div
      className={`relative h-[72vh] w-[min(92vw,420px)] ${className ?? ""}`}
      aria-label="Swipe deck"
    >
      <AnimatePresence initial={false}>
        {/* Background/next card */}
        {next && (
          <motion.div
            key={`${next.id}-bg`}
            className="absolute inset-0 rounded-3xl border border-white/10 bg-white/5 overflow-hidden"
            initial={{ scale: 0.995, y: 8, opacity: 0.6 }}
            animate={{
              scale: 0.995,
              y: 8,
              opacity: 1,
              filter:
                isDragging || cardTilt > 0
                  ? `blur(${Math.min(8, cardTilt / 12)}px)`
                  : "blur(0px)",
            }}
            transition={{ filter: { duration: 0.15 } }}
            exit={{ opacity: 0 }}
          >
            <CardFace spot={next} dim />
          </motion.div>
        )}

        {/* Top/interactive card */}
        {top && (
          <SwipeCard
            key={top.id}
            spot={top}
            exitDir={
              // For keyboard shortcuts, check Map first (most reliable)
              spotExitDirRef.current.has(top.id)
                ? spotExitDirRef.current.get(top.id)!
                : exitingSpotIdRef.current === top.id
                  ? (exitDirRef.current ?? exitDir ?? null)
                  : null
            }
            onCommit={commit}
            onFling={fling}
            onDragChange={(isDragging, tilt = 0) => {
              setIsDragging(isDragging);
              setCardTilt(tilt);
            }}
          />
        )}
      </AnimatePresence>

      {/* 3s confirmation toast */}
      <SaveIntentToast
        spot={
          intentSpot ? { id: intentSpot.id, title: intentSpot.title } : null
        }
        onTimeout={() => setIntentSpot(null)}
        onYes={() => {
          setIntentSpot(null);
          setPickerOpen(true);
        }}
      />

      {/* Collection picker; show confetti *after* successful save */}
      <SaveToCollectionSheet
        open={pickerOpen}
        spot={
          pickedSpot ? { id: pickedSpot.id, title: pickedSpot.title } : null
        }
        onClose={() => setPickerOpen(false)}
        onSaved={() => {
          setShowBurst(true);
          setTimeout(() => setShowBurst(false), 900);
        }}
      />

      {/* Success burst */}
      <SaveBurst show={showBurst} />
    </div>
  );
}

function SwipeCard({
  spot,
  exitDir,
  onCommit,
  onDragChange,
}: {
  spot: Spot;
  exitDir: "left" | "right" | null;
  onCommit: (dir: "left" | "right", spot: Spot) => void | Promise<void>;
  onFling: (dir: "left" | "right") => void;
  onDragChange?: (isDragging: boolean, tilt?: number) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-16, 0, 16]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const skipOpacity = useTransform(x, [-140, -40], [1, 0]);
  const ref = useRef<HTMLDivElement>(null);

  // Drag controls: image is the handle
  const dragControls = useDragControls();
  const startDragOnImage = (e: React.PointerEvent) => {
    e.preventDefault();
    dragControls.start(e);
  };

  const [localExitDir, setLocalExitDir] = useState<"left" | "right">("left");
  const exitDirRef = useRef<"left" | "right" | null>(null);

  // Update ref when exitDir prop changes (for keyboard shortcuts)
  // Use useLayoutEffect to ensure it's set synchronously before exit animation
  useLayoutEffect(() => {
    if (exitDir !== null) {
      exitDirRef.current = exitDir;
    }
  }, [exitDir]);

  const variants = {
    exit: (dir: "left" | "right") =>
      dir === "right"
        ? { x: 800, rotate: 16, opacity: 0, transition: { duration: 0.28 } }
        : { x: -800, rotate: -16, opacity: 0, transition: { duration: 0.28 } },
  } as const;

  // Determine exit direction: prioritize prop (keyboard), then local (drag), then default
  const finalExitDir = exitDirRef.current ?? exitDir ?? localExitDir;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 cursor-grab select-none rounded-3xl border border-white/10 bg-white/5 shadow-xl active:cursor-grabbing will-change-transform"
      style={{ x, rotate, touchAction: "pan-y" }}
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0.2}
      exit="exit"
      variants={variants}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => {
        onDragChange?.(true, 0);
      }}
      onDrag={(_, info) => {
        // Update blur in real-time as card moves based on tilt
        const currentX = x.get();
        const tilt = Math.abs(currentX);
        onDragChange?.(true, tilt);
      }}
      onDragEnd={(_, info) => {
        onDragChange?.(false);
        const w = ref.current?.offsetWidth ?? 400;
        const threshold = w * 0.35;
        const byDistance = Math.abs(x.get()) > threshold;
        const byVelocity = Math.abs(info.velocity.x) > 800;
        if (byDistance || byVelocity) {
          const dir = x.get() > 0 ? "right" : "left";
          setLocalExitDir(dir);
          exitDirRef.current = dir; // Also update ref for immediate use
          void onCommit(dir, spot);
        } else {
          x.set(0);
        }
      }}
      initial={{ opacity: 1, scale: 0.995, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      custom={finalExitDir}
    >
      <CardFace spot={spot} onPointerDownImage={startDragOnImage} />

      {/* Decision badges - positioned in opposite corners for mobile usability */}
      <motion.div
        className="pointer-events-none absolute right-0 top-0 rounded-bl-3xl rounded-tr-3xl p-[2px]"
        style={{
          opacity: skipOpacity,
          background: "linear-gradient(90deg, #ec4899 0%, #facc15 100%)",
        }}
      >
        <div className="rounded-bl-3xl rounded-tr-3xl bg-black/35 px-10 py-2 text-sm font-semibold">
          SKIP
        </div>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute left-0 top-0 rounded-br-3xl rounded-tl-3xl p-[2px]"
        style={{
          opacity: likeOpacity,
          background: "linear-gradient(90deg, #ec4899 0%, #facc15 100%)",
        }}
      >
        <div className="rounded-br-3xl rounded-tl-3xl bg-black/35 px-10 py-2 text-sm font-semibold">
          SAVE
        </div>
      </motion.div>
    </motion.div>
  );
}

function CardFace({
  spot,
  dim,
  onPointerDownImage,
}: {
  spot: Spot;
  dim?: boolean;
  onPointerDownImage?: (e: React.PointerEvent) => void;
}) {
  const location = useMemo(
    () => [spot.city, spot.country].filter(Boolean).join(", "),
    [spot.city, spot.country],
  );

  // Compute a crisp Cloudinary URL for the actual rendered size + DPR.
  const containerRef = useRef<HTMLDivElement>(null);
  const [sharpSrc, setSharpSrc] = useState<string | undefined>(spot.coverUrl);

  useEffect(() => {
    if (!spot.coverUrl) return;
    const el = containerRef.current;
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const width = el?.getBoundingClientRect().width ?? 420;
    const targetW = Math.max(720, width * dpr * 1.25); // headroom for rotation
    setSharpSrc(toCloudinaryUrl(spot.coverUrl, targetW, dpr));
  }, [spot.coverUrl]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-3xl"
    >
      {sharpSrc && (
        <div
          onPointerDown={onPointerDownImage}
          className={`relative h-full w-full ${dim ? "opacity-85" : ""}`}
        >
          <img
            src={sharpSrc}
            alt={spot.title}
            className="block h-full w-full select-none object-cover [backface-visibility:hidden] [transform:translateZ(0)]"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/80 to-white/0 p-4 dark:from-black dark:to-black/0">
        {/* Author info - clickable if username exists */}
        {spot.author && spot.author.username ? (
          <Link
            href={`/u/${spot.author.username}`}
            className="pointer-events-auto mb-2 flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {spot.author.image && (
              <Image
                width={28}
                height={28}
                src={spot.author.image}
                alt={spot.author.username ?? spot.author.name}
                className="rounded-full ring-2 ring-white/30 shadow-sm"
              />
            )}
            <span className="text-sm font-medium opacity-95 drop-shadow-sm">
              {spot.author.username ?? spot.author.name}
            </span>
          </Link>
        ) : spot.author ? (
          <div className="mb-2 flex items-center gap-2">
            {spot.author.image && (
              <Image
                width={28}
                height={28}
                src={spot.author.image}
                alt={spot.author.username ?? spot.author.name}
                className=" rounded-full ring-2 ring-white/30 shadow-sm"
              />
            )}
            <span className="text-sm font-medium opacity-95 drop-shadow-sm">
              {spot.author.username ?? spot.author.name}
            </span>
          </div>
        ) : null}
        <div className="text-lg font-semibold">{spot.title}</div>
        {location && <div className="text-sm opacity-80">{location}</div>}
      </div>
    </div>
  );
}
