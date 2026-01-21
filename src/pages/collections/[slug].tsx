// pages/collections/[slug].tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { useSession } from "next-auth/react";
import { useState } from "react";

type SpotCardT = {
  id: string;
  title: string;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
  slug: string;
};
// pages/collections/[slug].tsx
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = (ctx.params?.slug as string) ?? "";
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const viewerId = (session?.user as { id: string } | undefined)?.id ?? null;

  // 1) pokud někdo dal do URL přímo ID kolekce, vezmeme to rovnou
  const byId = await prisma.collection.findUnique({
    where: { id: slug },
    select: { id: true },
  });

  // 2) přihlášený uživatel + slug → compound unique userId_slug
  const byUserAndSlug =
    !byId && viewerId
      ? await prisma.collection.findUnique({
          where: { userId_slug: { userId: viewerId, slug } },
          select: { id: true },
        })
      : null;

  // 3) fallback: veřejná kolekce se stejným slugem (není unikátní globálně)
  const byPublicSlug =
    !byId && !byUserAndSlug
      ? await prisma.collection.findFirst({
          where: { slug, isPublic: true },
          select: { id: true },
        })
      : null;

  const collection = byId ?? byUserAndSlug ?? byPublicSlug;
  if (!collection) return { notFound: true };

  const col = await prisma.collection.findUnique({
    where: { id: collection.id },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublic: true,
      userId: true,
      user: { select: { id: true, username: true, name: true, image: true } },
      spots: {
        orderBy: { addedAt: "desc" },
        select: {
          spot: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
              image: true,
              city: true,
              country: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  if (!col) return { notFound: true };

  const isOwner = !!viewerId && viewerId === col.userId;
  if (!col.isPublic && !isOwner) return { notFound: true };

  const spots = col.spots.map((cs) => ({
    id: cs.spot.id,
    title: cs.spot.title,
    coverUrl: cs.spot.coverUrl ?? cs.spot.image ?? null,
    city: cs.spot.city ?? null,
    country: cs.spot.country ?? null,
    slug: cs.spot.slug,
  }));

  return {
    props: {
      col: {
        id: col.id,
        name: col.name,
        slug: col.slug,
        isPublic: col.isPublic,
        owner: {
          id: col.user.id,
          username: col.user.username,
          name: col.user.name,
          image: col.user.image ?? null,
        },
        spots,
      },
      isOwner,
    },
  };
};

import { PinCard } from "@/components/PinCard";

// Owner-only visibility toggle
function VisibilityToggle({
  collectionId,
  initialIsPublic,
}: {
  collectionId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    try {
      setLoading(true);
      const next = !isPublic;
      setIsPublic(next); // optimistic
      const res = await fetch(`/api/collections/${collectionId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) {
        setIsPublic(!next); // revert
        const { error } = await res
          .json()
          .catch(() => ({ error: "Update failed" }));
        throw new Error(error || "Update failed");
      }
    } catch (e) {
      console.error(e);
      // optional toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-sm transition
        ${
          isPublic
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
            : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
      title={isPublic ? "Make private" : "Make public"}
    >
      {loading ? "Saving…" : isPublic ? "Public • Make private" : "Make public"}
    </button>
  );
}

export default function CollectionPage({
  col,
  isOwner,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session } = useSession();
  const viewerName =
    (session?.user?.name as string) ??
    (session?.user?.email as string) ??
    "User";

  const title = `${col.name} • Collection`;
  const desc = `Places in the "${col.name}" collection${
    col.owner?.username ? ` by @${col.owner.username}` : ""
  }`;

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <link rel="canonical" href={`/collections/${col.slug}`} />
      </Head>

      <HeaderWithMenu
        displayName={viewerName}
        avatarUrl={session?.user?.image ?? undefined}
      />
      <div className="h-16 sm:h-[72px]" />

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-32 md:pb-8 md:ml-72">
        {/* header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{col.name}</h1>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {col.owner?.username ? (
                <>
                  by{" "}
                  <Link
                    href={`/u/${col.owner.username}`}
                    className="underline-offset-2 hover:underline"
                  >
                    @{col.owner.username}
                  </Link>
                </>
              ) : null}
              {!col.isPublic && (
                <>
                  {" "}
                  ·{" "}
                  <span className="rounded-full bg-zinc-200/60 px-2 py-0.5 text-xs dark:bg-zinc-800/60">
                    Private
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <VisibilityToggle
                collectionId={col.id}
                initialIsPublic={col.isPublic}
              />
            )}
            <Link
              href="/profile"
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              ← Back to profile
            </Link>
          </div>
        </div>

        {/* grid */}
        {col.spots.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No spots in this collection yet.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
            {col.spots.map((s: SpotCardT) => (
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
      </main>
    </div>
  );
}
