// pages/u/[username].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { Magnetic } from "@/components/ui/Magnetic";
import { CollectionPinCard } from "@/components/CollectionPinCard";
import { PinCard } from "@/components/PinCard";
import { useRouter } from "next/router";

/* ---------- Types ---------- */
type CollectionItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  coverUrl: string | null;
  isPublic: boolean;
};

type SpotItem = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
};

/* ---------- SSR ---------- */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const raw = (ctx.params?.username as string | undefined) ?? "";
  const username = raw.replace(/^@/, "").trim();
  if (!username || username.length < 3 || username.length > 32) {
    return { notFound: true };
  }

  // Case-insensitive user lookup
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) return { notFound: true };

  // Check if viewer is the owner
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const viewerId = (session?.user as { id: string } | undefined)?.id ?? null;
  const isOwner = !!viewerId && viewerId === user.id;

  // Get follow status between viewer and profile owner
  let isFollowing = false;
  let isFollowedBy = false;
  if (viewerId && !isOwner) {
    try {
      const [followingRecord, followerRecord] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: viewerId,
            },
          },
        }),
      ]);
      isFollowing = !!followingRecord;
      isFollowedBy = !!followerRecord;
    } catch (e) {
      console.warn("Could not fetch follow status:", e);
    }
  }

  // Get only public collections
  const rawCols = await prisma.collection.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublic: true,
      _count: { select: { spots: true } },
      spots: {
        orderBy: { addedAt: "desc" },
        take: 1,
        select: {
          spot: { select: { coverUrl: true, image: true } },
        },
      },
    },
  });

  const collections = rawCols.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count.spots,
    coverUrl: c.spots[0]?.spot.coverUrl ?? c.spots[0]?.spot.image ?? null,
    isPublic: c.isPublic,
  }));

  // Latest spots by this user
  const spots = await prisma.spot.findMany({
    where: { author: { is: { id: user.id } } },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      coverUrl: true,
      city: true,
      country: true,
    },
  });

  return {
    props: {
      profile: {
        id: user.id,
        name: user.name ?? null,
        username: user.username,
        image: user.image ?? null,
        bio: user.bio ?? null,
        createdAt: user.createdAt.toISOString(),
      },
      collections,
      latestSpots: spots,
      followStatus: {
        isFollowing,
        isFollowedBy,
      },
    },
  };
};

/* ---------- Small UI ---------- */
function PillButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3.5 py-1.5 rounded-full text-sm font-medium transition ring-1",
        active
          ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
          : "bg-white/70 text-zinc-700 ring-zinc-200 hover:bg-white dark:bg-zinc-900/40 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-900/60",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ---------- Follow Status Badge (Interactive) ---------- */
function FollowStatusBadge({
  userId,
  initialIsFollowing,
  isFollowedBy,
}: {
  userId: string;
  initialIsFollowing: boolean;
  isFollowedBy: boolean;
}) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const isFriend = isFollowing && isFollowedBy;
  const shouldFollowBack = !isFollowing && isFollowedBy;

  const followMutation = useMutation({
    mutationFn: async (following: boolean) => {
      const [res] = await Promise.all([
        (async () => {
          const method = following ? "POST" : "DELETE";
          const response = await fetch("/api/follow", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
            credentials: "include",
          });
          if (!response.ok) throw new Error(await response.text());
          return response.json();
        })(),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
      return res;
    },
    onSuccess: (data, variables) => {
      setIsFollowing(variables);
      queryClient.invalidateQueries({
        queryKey: ["people"],
        refetchType: "none",
      });
    },
    onError: (error) => {
      console.error("Follow error:", error);
    },
  });

  const isPending = followMutation.isPending;

  const handleClick = () => {
    if (isPending) return;
    // Friends or Following -> unfollow, Follow back -> follow
    followMutation.mutate(!isFollowing);
  };

  // Determine which state to show
  let label: string;
  let bgColorClass: string;
  let hoverClass: string;
  let icon: React.ReactNode;

  if (isFriend) {
    label = "Friends";
    bgColorClass =
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    hoverClass = "hover:bg-violet-200 dark:hover:bg-violet-900/50";
    icon = (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    );
  } else if (shouldFollowBack) {
    label = "Follow back";
    bgColorClass = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
    hoverClass = "hover:bg-zinc-800 dark:hover:bg-zinc-200";
    icon = (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    );
  } else {
    // isFollowing only
    label = "Following";
    bgColorClass =
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    hoverClass = "hover:bg-zinc-200 dark:hover:bg-zinc-700";
    icon = (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  // Determine dot color based on state
  const dotColorClass = isFriend
    ? "text-violet-500 dark:text-violet-400"
    : shouldFollowBack
      ? "text-pink-500 dark:text-yellow-400"
      : "text-zinc-400 dark:text-zinc-500";

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      whileHover={!isPending ? { scale: 1.05 } : {}}
      whileTap={!isPending ? { scale: 0.95 } : {}}
      className={`group/badge relative inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${bgColorClass} ${hoverClass} ${
        isPending ? "cursor-wait opacity-70" : "cursor-pointer"
      }`}
    >
      {/* Animated dot border */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-full opacity-0 transition-opacity duration-300 group-hover/badge:opacity-100">
        <motion.svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          initial={false}
        >
          <motion.rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="9999"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={dotColorClass}
            strokeLinecap="round"
            strokeDasharray="0.02 0.48"
            pathLength={1}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -1 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.svg>
      </div>
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.svg
            key="loading"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          </motion.svg>
        ) : (
          <motion.span
            key="icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {icon}
          </motion.span>
        )}
      </AnimatePresence>
      {label}
    </motion.button>
  );
}

/* ---------- Page ---------- */
export default function PublicProfilePage({
  profile,
  collections,
  latestSpots,
  followStatus,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session } = useSession();
  const router = useRouter(); // přidat

  // místo: const [tab, setTab] = useState<"spots" | "collections">("spots");
  const [tab, setTab] = useState<"spots" | "collections">(
    router.query.tab === "collections" ? "collections" : "spots",
  );

  function setTabAndUrl(next: "spots" | "collections") {
    setTab(next);
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: next },
      },
      undefined,
      { shallow: true },
    );
  }
  // Safety guard
  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center text-zinc-600 dark:text-zinc-300">
        <p>Profile not found.</p>
      </div>
    );
  }

  const isOwner =
    !!session &&
    (session.user as any)?.username?.toLowerCase?.() ===
      profile.username.toLowerCase();

  const viewerName =
    (session?.user?.name as string) ??
    (session?.user?.email as string) ??
    "User";

  const title = profile.name
    ? `${profile.name} (@${profile.username})`
    : `@${profile.username}`;
  const desc =
    profile.bio ?? `Explore spots and collections by @${profile.username}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        {profile.image && <meta property="og:image" content={profile.image} />}
        <link rel="canonical" href={`/u/${profile.username}`} />
      </Head>

      <HeaderWithMenu
        displayName={viewerName}
        avatarUrl={(session?.user as any)?.image ?? undefined}
      />
      <div className="h-16 sm:h-[72px]" />

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-32 md:pb-8 md:ml-72">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar wrapper */}
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={profile.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-zinc-100 text-4xl dark:bg-zinc-800">
                {(profile.name ?? profile.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                {profile.name ?? `@${profile.username}`}
              </h1>
              {/* Follow status badge - next to the name */}
              {!isOwner &&
                session &&
                (followStatus?.isFollowing || followStatus?.isFollowedBy) && (
                  <FollowStatusBadge
                    userId={profile.id}
                    initialIsFollowing={followStatus.isFollowing}
                    isFollowedBy={followStatus.isFollowedBy}
                  />
                )}
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              @{profile.username}
            </div>
            {profile.bio && (
              <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-300">
                {profile.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span>{collections.length} public collections</span>
              <span aria-hidden>•</span>
              <span>
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {isOwner && (
            <Link
              href="/profile/settings"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Edit profile
            </Link>
          )}
        </div>

        {/* Tabs — Spots first, then Collections */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Magnetic strength={0.12} className="inline-block">
              <PillButton
                active={tab === "spots"}
                onClick={() => setTabAndUrl("spots")}
              >
                Spots ({latestSpots.length})
              </PillButton>
            </Magnetic>
            <Magnetic strength={0.12} className="inline-block">
              <PillButton
                active={tab === "collections"}
                onClick={() => setTabAndUrl("collections")}
              >
                Collections ({collections.length})
              </PillButton>
            </Magnetic>
          </div>
        </div>

        {/* Content */}
        {tab === "collections" ? (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-medium">
              {isOwner ? "Collections" : "Public collections"}
            </h2>
            {collections.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isOwner
                  ? "You don't have any collections yet."
                  : "This user doesn't have any public collections yet."}
              </p>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
                {(collections as CollectionItem[]).map((c) => (
                  <CollectionPinCard
                    key={c.id}
                    id={c.id}
                    name={c.name}
                    slug={c.slug}
                    coverUrl={c.coverUrl}
                    count={c.count}
                    username={profile.username}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-medium">Latest spots</h2>
            {latestSpots.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No spots to show yet.
              </p>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
                {(latestSpots as SpotItem[]).map((s) => (
                  <PinCard
                    key={s.id}
                    id={s.id}
                    slug={s.slug}
                    title={s.title}
                    mediaUrl={s.coverUrl || ""}
                    city={s.city}
                    country={s.country}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
