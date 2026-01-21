"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import HeaderWithMenu from "@/components/HeaderWithMenu";

// ---------- Types shared with API ----------
export type Pin = {
  id: string;
  slug: string;
  title?: string;
  mediaUrl: string; // Cloudinary publicId or full URL
  kind?: "image" | "video";
  width?: number;
  height?: number;
  user: { name: string; avatar: string; handle?: string };
  location?: string;
  likes?: number;
  comments?: number;
  saved?: boolean;
  tags?: string[];
};

export type ExploreResponse = {
  items: Pin[];
  nextCursor: string | null;
};

// ---------- Cloudinary helpers ----------
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

const TAGS = [
  "all",
  "city",
  "nature",
  "cave",
  "world wonder",
  "tower",
  "fun",
  "beach",
];

export default function DiscoverPage() {
  const { data: session } = useSession();

  const [pins, setPins] = useState<Pin[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Track opened cards (for mobile/tap)
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // first load + when filters change
  useEffect(() => {
    setPins([]);
    setCursor(null);
    setHasMore(true);
    setOpen(new Set());
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTag]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && void loadMore());
      },
      { rootMargin: "1200px 0px" }
    );
    io.observe(target);
    return () => io.unobserve(target);
  }, [cursor, hasMore, isLoading]);

  async function loadMore(reset = false) {
    if (isLoading || (!hasMore && !reset)) return;
    setIsLoading(true);
    const params = new URLSearchParams();
    if (cursor && !reset) params.set("cursor", cursor);
    params.set("limit", "48");
    if (query) params.set("q", query);
    if (activeTag && activeTag !== "all") params.set("tag", activeTag);

    const res = await fetch(`/api/explore?${params.toString()}`);
    if (!res.ok) {
      console.error("Explore API failed", await res.text());
      setIsLoading(false);
      return;
    }
    const data: ExploreResponse = await res.json();

    setPins((prev) => (reset ? data.items : [...prev, ...data.items]));
    setCursor(data.nextCursor);
    setHasMore(Boolean(data.nextCursor));
    setIsLoading(false);
  }

  // instant client filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pins.filter((p) => {
      const matchesText =
        !q || `${p.title ?? ""} ${p.location ?? ""}`.toLowerCase().includes(q);
      const matchesTag =
        activeTag === "all" || (p.tags ?? []).includes(activeTag);
      return matchesText && matchesTag;
    });
  }, [pins, query, activeTag]);

  function PinCard({ pin }: { pin: Pin }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Link
        href={`/spot/${pin.slug || pin.id}`}
        className="mb-5 break-inside-avoid overflow-hidden rounded-2xl relative cursor-pointer block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={toCloudinaryUrl(pin.mediaUrl, 1100)}
          alt={pin.title ?? ""}
          className="block w-full h-auto rounded-2xl"
          loading="lazy"
        />
        {(pin.title || pin.location) && (
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
                  {pin.title && (
                    <h3 className="mb-1 font-semibold text-sm text-white whitespace-nowrap">
                      {pin.title}
                    </h3>
                  )}
                  {pin.location && (
                    <p className="text-xs text-white/80 whitespace-nowrap">
                      {pin.location}
                    </p>
                  )}
                </motion.div>
                {/* Mobile: always visible text */}
                <div className="md:hidden">
                  {pin.title && (
                    <h3 className="mb-1 font-semibold text-sm text-white whitespace-nowrap">
                      {pin.title}
                    </h3>
                  )}
                  {pin.location && (
                    <p className="text-xs text-white/80 whitespace-nowrap">
                      {pin.location}
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

  return (
    <>
      <Head>
        <title>Discover • Exploree</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      {/* Header */}
      <HeaderWithMenu
        avatarUrl={session?.user?.image ?? undefined}
        displayName={
          (session?.user?.name ?? session?.user?.email ?? "U") as string
        }
      />

      {/* Search + controls */}
      <div className="sticky top-16 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:ml-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="h-5 w-5 text-zinc-400" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places, vibes, tags…"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-10 py-2 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
          </div>

          {/* Tag pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {TAGS.map((t) => {
              const active = t === activeTag;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTag(t)}
                  className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors ${
                    active
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Masonry grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-32 mt-16 md:pb-8 md:ml-72">
        <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
          {filtered.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="mb-5 h-[220px] break-inside-avoid rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-16" />
      </main>
    </>
  );
}
