// pages/spot/[slug].tsx
import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import {
  SaveToCollectionSheet,
  SaveBurst,
} from "@/components/SaveToCollectionSheet";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = (ctx.params?.slug as string | undefined) ?? "";
  if (!slug) {
    return { notFound: true };
  }

  const spot = await prisma.spot.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      lat: true,
      lng: true,
      city: true,
      country: true,
      coverUrl: true,
      image: true,
      tags: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          collections: true,
        },
      },
    },
  });

  if (!spot) {
    return { notFound: true };
  }

  // Total saves = direct saves + spots in collections
  const totalSaves = spot._count.saves + spot._count.collections;

  // Get collections that contain this spot
  const collectionsWithSpot = await prisma.collectionSpot.findMany({
    where: { spotId: spot.id },
    select: {
      collection: {
        select: {
          id: true,
          name: true,
          slug: true,
          userId: true,
          isPublic: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  const allCollections = collectionsWithSpot.map((cs) => ({
    id: cs.collection.id,
    name: cs.collection.name,
    slug: cs.collection.slug,
    userId: cs.collection.userId,
    username: cs.collection.user.username,
    isPublic: cs.collection.isPublic,
  }));

  // Separate public and private collections
  const savedIn = allCollections.filter((c) => c.isPublic);
  const privateCount = allCollections.filter((c) => !c.isPublic).length;

  return {
    props: {
      spot: {
        ...spot,
        createdAt: spot.createdAt.toISOString(),
        tags: Array.isArray(spot.tags) ? spot.tags : [],
        _count: {
          ...spot._count,
          saves: totalSaves,
        },
      },
      savedIn,
      privateCollectionsCount: privateCount,
    },
  };
};

export default function SpotDetailPage({
  spot,
  savedIn,
  privateCollectionsCount,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const viewerName =
    (session?.user?.name as string) ??
    (session?.user?.email as string) ??
    "User";

  const title = `${spot.title}${
    spot.city || spot.country
      ? ` - ${[spot.city, spot.country].filter(Boolean).join(", ")}`
      : ""
  }`;
  const description =
    spot.description || `Explore ${spot.title} by @${spot.author.username}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {spot.coverUrl && <meta property="og:image" content={spot.coverUrl} />}
        <link rel="canonical" href={`/spot/${spot.slug}`} />
      </Head>

      <HeaderWithMenu
        displayName={viewerName}
        avatarUrl={(session?.user as any)?.image ?? undefined}
      />
      <div className="h-16 sm:h-[72px]" />

      <main className="w-full max-w-[100vw] md:max-w-[calc(100vw-288px)] px-4 pb-32 md:pb-16 md:ml-72 sm:px-6">
        {/* Back button */}
        <Link
          href={spot.author.username ? `/u/${spot.author.username}` : "/"}
          className="mt-4 mb-6 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to profile
        </Link>

        {/* Image and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-6">
          {/* Main image and content */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
              {spot.coverUrl || spot.image ? (
                <Image
                  src={spot.coverUrl || spot.image}
                  alt={spot.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  No image
                </div>
              )}
            </div>

            {/* Title and location */}
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                {spot.title}
              </h1>
              {(spot.city || spot.country) && (
                <div className="mt-1.5 sm:mt-2 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
                  {[spot.city, spot.country].filter(Boolean).join(", ")}
                </div>
              )}
            </div>

            {/* Author */}
            {spot.author.username && (
              <div className="flex items-center gap-3">
                <Link
                  href={`/u/${spot.author.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {spot.author.image ? (
                    <Image
                      src={spot.author.image}
                      alt={spot.author.name || spot.author.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
                      {(spot.author.name || spot.author.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm sm:text-base">
                      {spot.author.name || `@${spot.author.username}`}
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      @{spot.author.username}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Save to collection button */}
            {session && (
              <button
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
              >
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
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                Save to collection
              </button>
            )}

            {/* Tags - mobile only */}
            {Array.isArray(spot.tags) && spot.tags.length > 0 && (
              <div className="lg:hidden">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {spot.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs sm:text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {spot.description && (
              <div>
                <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {spot.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - right side (desktop only) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            {/* Tags */}
            {Array.isArray(spot.tags) && spot.tags.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {spot.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Stats
              </h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <div>{spot._count.likes} likes</div>
                <div>{spot._count.saves} saves</div>
                <div>
                  {new Date(spot.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Saved in collections */}
            {(savedIn && savedIn.length > 0) || privateCollectionsCount > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  Saved in
                </h3>
                <div className="space-y-2">
                  {savedIn &&
                    savedIn.map(
                      (col: {
                        id: string;
                        name: string;
                        slug: string;
                        userId: string;
                        username: string;
                      }) => (
                        <Link
                          key={col.id}
                          href={`/u/${col.username}/collections/${col.slug}`}
                          className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {col.name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            by @{col.username}
                          </div>
                        </Link>
                      ),
                    )}
                  {privateCollectionsCount > 0 && (
                    <div className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="font-medium text-zinc-500 dark:text-zinc-400">
                        and {privateCollectionsCount} private
                        {privateCollectionsCount === 1
                          ? " collection"
                          : " collections"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Map link */}
            {spot.lat && spot.lng && (
              <div>
                <a
                  href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <svg
                    className="h-4 w-4"
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
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Save to collection sheet */}
        <SaveToCollectionSheet
          open={pickerOpen}
          spot={{ id: spot.id, title: spot.title }}
          onClose={() => setPickerOpen(false)}
          onSaved={() => {
            setShowBurst(true);
            setTimeout(() => setShowBurst(false), 900);
          }}
        />

        {/* Success burst */}
        <SaveBurst show={showBurst} />
      </main>
    </div>
  );
}
