// pages/u/[username]/collections/[slug].tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { PinCard } from "@/components/PinCard";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

type SpotItem = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const rawUser = (ctx.params?.username as string) ?? "";
  const slugOrId = (ctx.params?.slug as string) ?? "";
  const username = rawUser.replace(/^@/, "").trim();

  const candidates = Array.from(
    new Set([username, username.toLowerCase(), username.toUpperCase()]),
  );

  const user = await prisma.user.findFirst({
    where: { username: { in: candidates } },
    select: { id: true, username: true, name: true, image: true },
  });
  if (!user) return { notFound: true };

  const collection =
    (await prisma.collection.findFirst({
      where: { userId: user.id, slug: slugOrId },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublic: true,
        createdAt: true,
        spots: {
          select: {
            spot: {
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
          orderBy: { addedAt: "desc" },
        },
      },
    })) ??
    (await prisma.collection.findFirst({
      where: { userId: user.id, id: slugOrId },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublic: true,
        createdAt: true,
        spots: {
          select: {
            spot: {
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
          orderBy: { addedAt: "desc" },
        },
      },
    }));

  if (!collection || !collection.isPublic) return { notFound: true };

  return {
    props: {
      profile: {
        username: user.username,
        name: user.name ?? null,
        image: user.image ?? null,
      },
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        createdAt: collection.createdAt.toISOString(),
        items: collection.spots.map((cs) => cs.spot),
      },
    },
  };
};

export default function CollectionDetailPage({
  profile,
  collection,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session } = useSession();
  const title = `${collection.name} – @${profile.username}`;

  const viewerName =
    (session?.user?.name as string) ??
    (session?.user?.email as string) ??
    "User";

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={`Collection ${collection.name} by @${profile.username}`}
        />
      </Head>

      <HeaderWithMenu
        displayName={viewerName}
        avatarUrl={(session?.user as any)?.image ?? undefined}
      />
      <div className="h-16 sm:h-[72px]" />

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-32 md:pb-8 md:ml-72">
        {/* Calmer header */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                {collection.name}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href={`/u/${profile.username}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {(profile.name ?? profile.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {profile.name ?? `@${profile.username}`}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      @{profile.username}
                    </span>
                  </div>
                </Link>
                <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
                  •
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Created {new Date(collection.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Link
              href={`/u/${profile.username}`}
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              ← Back
            </Link>
          </div>
        </div>

        {collection.items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This collection is empty.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
            {(collection.items as SpotItem[]).map((s) => (
              <PinCard
                key={s.id}
                id={s.id}
                slug={s.slug || s.id}
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
