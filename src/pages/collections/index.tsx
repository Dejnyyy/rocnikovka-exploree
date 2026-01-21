// pages/collections/index.tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { useState } from "react";

type MyCollection = {
  id: string;
  name: string;
  slug: string | null;
  isPublic: boolean;
  coverUrl: string | null;
  count: number;
};
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const raw = (ctx.params?.username as string | undefined) ?? "";
  const username = raw.replace(/^@/, "").trim();
  if (!username || username.length < 3 || username.length > 32)
    return { notFound: true };

  // If you store a lowercase mirror: where: { usernameLower: username.toLowerCase() }
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
      // 🔹 Pull latest spots through the *relation* (no userId scalar needed)
      spots: {
        orderBy: {
          /* fallback if you don't have createdAt: id: "desc" */ createdAt:
            "desc",
        },
        take: 24,
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          city: true,
          country: true,
        },
      },
    },
  });

  if (!user) return { notFound: true };

  // Public collections; derive a cover from the newest spot in each collection
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
        select: { spot: { select: { coverUrl: true, image: true } } },
      },
    },
  });

  const collections: MyCollection[] = rawCols.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isPublic: c.isPublic,
    count: c._count.spots,
    coverUrl: c.spots[0]?.spot.coverUrl ?? c.spots[0]?.spot.image ?? null,
  }));

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
      latestSpots: user.spots, // ✅ from relation
    },
  };
};

// Small inline toggle button for each card
function VisibilityChip({
  id,
  isPublicInitial,
  onChange,
}: {
  id: string;
  isPublicInitial: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [isPublic, setIsPublic] = useState(isPublicInitial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    try {
      setLoading(true);
      const next = !isPublic;
      setIsPublic(next); // optimistic
      onChange?.(next);

      const res = await fetch(`/api/collections/${id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });

      if (!res.ok) {
        // revert on failure
        setIsPublic(!next);
        onChange?.(!next);
        const { error } = await res
          .json()
          .catch(() => ({ error: "Update failed" }));
        throw new Error(error || "Update failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={loading}
      className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm ${
        isPublic
          ? "bg-emerald-600/90 text-white hover:bg-emerald-600"
          : "bg-zinc-600/80 text-white hover:bg-zinc-700"
      } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
      title={isPublic ? "Make private" : "Make public"}
    >
      {loading ? "Saving…" : isPublic ? "Public" : "Private"}
    </button>
  );
}

export default function MyCollectionsPage({
  collections,
  viewerName,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // local state so the chip can update immediately
  const [rows, setRows] = useState<MyCollection[]>(
    collections as MyCollection[],
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head>
        <title>My Collections</title>
        <meta name="description" content="Your collections" />
        <link rel="canonical" href="/collections" />
      </Head>

      <HeaderWithMenu displayName={viewerName} avatarUrl={undefined} />
      <div className="h-16 sm:h-[72px]" />

      <main className="mx-auto w-full max-w-5xl px-4 pb-32 md:pb-16 md:ml-72 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold sm:text-3xl">My Collections</h1>
          <Link
            href="/profile"
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            ← Back to profile
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You have no collections yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((c, idx) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug ?? c.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 dark:border-zinc-800 dark:bg-zinc-900/30"
              >
                <div className="relative w-full pt-[60%]">
                  {c.coverUrl ? (
                    <Image
                      src={c.coverUrl}
                      alt={c.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-zinc-400 text-xs">
                      No cover
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 sm:p-2.5">
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    <div className="relative z-10 inline-flex max-w-[92%] flex-col gap-0.5 rounded-xl bg-black/35 px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
                      <div className="line-clamp-1 text-[13px] font-medium text-white/95 drop-shadow">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-white/85 drop-shadow-sm">
                        {c.count} items
                        {/* Old static badge removed; chip below is clickable */}
                        <span className="pointer-events-auto">
                          <VisibilityChip
                            id={c.id}
                            isPublicInitial={c.isPublic}
                            onChange={(next) => {
                              setRows((r) => {
                                const copy = [...r];
                                copy[idx] = { ...copy[idx], isPublic: next };
                                return copy;
                              });
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
