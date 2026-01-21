"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
});

type Person = {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  spotsCount?: number;
  collectionsCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isOwnProfile?: boolean;
};

function useDebounce<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function PeoplePage() {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 350);
  const limit = 24;

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["people", { q: dq, limit }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (dq) params.set("q", dq);
      params.set("limit", String(limit));
      if (pageParam) params.set("cursor", String(pageParam));

      const res = await fetch(`/api/people?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fetchNextPage();
      },
      { rootMargin: "600px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, fetchNextPage, data?.pages?.length]);

  const items = (data?.pages ?? []).reduce<Person[]>(
    (acc: Person[], p: any) => (acc.push(...p.items), acc),
    []
  );

  return (
    <div
      className={`${quicksand.className} min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
    >
      <HeaderWithMenu
        avatarUrl={session?.user?.image ?? undefined}
        displayName={
          (session?.user?.name ?? session?.user?.email ?? "U") as string
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-6 pt-24 pb-32 md:pb-6 md:ml-72">
        <header className="mb-8">
          <h1 className={`${quicksand.className} text-3xl font-bold mb-6`}>
            People
          </h1>
          <div className="relative w-full max-w-lg">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or username…"
              className="w-full rounded-2xl border border-zinc-300 bg-white pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
            <AnimatePresence>
              {q && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
                >
                  Clear
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </header>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PersonCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            Failed to load people list. Please try again.
          </div>
        )}

        {!isLoading && !error && !items.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h2 className="mb-2 text-lg font-semibold">No users found</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {q
                ? `No users match "${q}". Try a different search.`
                : "No users available yet."}
            </p>
          </div>
        )}

        {items.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, idx) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <PersonCard person={p} />
              </motion.li>
            ))}
          </ul>
        )}

        <div ref={sentinelRef} className="h-12" />
        {isFetchingNextPage && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
            Loading more…
          </div>
        )}
      </main>
    </div>
  );
}

// --- BORDER ANIMATION ---
const BorderAnimation = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <motion.svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        initial={false}
      >
        <motion.rect
          width="100%"
          height="100%"
          rx="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2" // Thickness of the dots
          className="text-pink-700 dark:text-yellow-400"
          strokeLinecap="round" // Makes the dash resemble a "point"/dot
          // 0.001 dash (dot), 0.499 gap. Sum = 0.5. Repeats twice to fill 1.0 (100%).
          strokeDasharray="0.03 0.49"
          pathLength={1}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -1 }} // Spins nicely
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.svg>
    </div>
  );
};

function PersonCard({ person }: { person: Person }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(person.isFollowing ?? false);
  const isFollowedBy = person.isFollowedBy ?? false;

  const name = person.name ?? "Unnamed";
  const handle = person.username ? `@${person.username}` : null;
  const href = person.username
    ? `/u/${encodeURIComponent(person.username)}`
    : null;

  const spotsCount = person.spotsCount ?? 0;
  const collectionsCount = person.collectionsCount ?? 0;
  const hasBio = person.bio && person.bio.trim().length > 0;

  // Double check: compare with session user id as well
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const isOwnProfile =
    person.isOwnProfile ??
    (sessionUserId ? sessionUserId === person.id : false);
  const canFollow =
    session && sessionUserId && !isOwnProfile && sessionUserId !== person.id;

  // Compute relationship status
  const isFriend = isFollowing && isFollowedBy;
  const shouldFollowBack = !isFollowing && isFollowedBy;

  const followMutation = useMutation({
    mutationFn: async (following: boolean) => {
      // Add minimum delay to ensure loading animation is visible
      const [res] = await Promise.all([
        (async () => {
          const method = following ? "POST" : "DELETE";
          const response = await fetch("/api/follow", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: person.id }),
            credentials: "include",
          });
          if (!response.ok) throw new Error(await response.text());
          return response.json();
        })(),
        new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms delay to show animation
      ]);
      return res;
    },
    onSuccess: (data, variables) => {
      // Update UI after successful mutation
      setIsFollowing(variables);
      // Invalidate queries in the background without refetching immediately
      queryClient.invalidateQueries({
        queryKey: ["people"],
        refetchType: "none", // Don't refetch immediately
      });
    },
    onError: (error, variables, context) => {
      // Revert on error - don't change state
      console.error("Follow error:", error);
    },
  });

  const isPending = followMutation.isPending;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Extra safety check - prevent following yourself
    if (
      !canFollow ||
      isPending ||
      isOwnProfile ||
      sessionUserId === person.id
    ) {
      return;
    }
    followMutation.mutate(!isFollowing);
  };

  const inner = (
    <div className="relative z-10">
      <div className="flex items-start gap-4 mb-4">
        <Avatar src={person.image ?? undefined} alt={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold mb-0.5">{name}</div>
          {handle && (
            <div className="truncate text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              {handle}
            </div>
          )}
          {hasBio && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-2">
              {person.bio}
            </p>
          )}
        </div>
        {canFollow && (
          <motion.button
            onClick={handleFollowClick}
            disabled={isPending}
            whileHover={!isPending ? { scale: 1.05 } : {}}
            whileTap={!isPending ? { scale: 0.95 } : {}}
            className={`shrink-0 relative overflow-hidden px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
              isFriend
                ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                : isFollowing
                ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            } ${isPending ? "cursor-wait" : "cursor-pointer"}`}
          >
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </motion.svg>
                </motion.div>
              ) : isFriend ? (
                <motion.div
                  key="friends"
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center gap-1.5"
                >
                  <motion.svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </motion.svg>
                  <span>Friends</span>
                </motion.div>
              ) : isFollowing ? (
                <motion.div
                  key="following"
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center gap-1.5"
                >
                  <motion.svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                  <span>Following</span>
                </motion.div>
              ) : shouldFollowBack ? (
                <motion.div
                  key="followBack"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </motion.svg>
                  <span>Follow back</span>
                </motion.div>
              ) : (
                <motion.div
                  key="follow"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </motion.svg>
                  <span>Follow</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {spotsCount}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {spotsCount === 1 ? "spot" : "spots"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {collectionsCount}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {collectionsCount === 1 ? "collection" : "collections"}
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch={false}
        className="group relative block overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-800"
        title={`${name}${handle ? ` (${handle})` : ""}`}
      >
        <BorderAnimation />
        {inner}
      </Link>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <BorderAnimation />
      {inner}
    </div>
  );
}

function Avatar({
  src,
  alt,
  size = "md",
}: {
  src?: string;
  alt: string;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-16 w-16" : "h-10 w-10";
  const textSizeClass = size === "lg" ? "text-lg" : "text-xs";
  const initial = alt.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <div
          className={`grid h-full w-full place-items-center font-semibold text-zinc-600 dark:text-zinc-300 ${textSizeClass}`}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

function PersonCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-2" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
