// pages/invites.tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return { redirect: { destination: "/api/auth/signin", permanent: false } };

  return { props: {} };
};

// ── Pending invite card ───────────────────────────────────────
type PreviewSpot = {
  id: string;
  title: string;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
  slug: string;
};

function InviteCard({
  invite,
  onRespond,
}: {
  invite: {
    id: string;
    collectionId: string;
    collectionName: string;
    collectionSlug: string | null;
    spotCount: number;
    owner: {
      username: string | null;
      name: string | null;
      image: string | null;
    };
  };
  onRespond: (collectionId: string, accept: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewSpots, setPreviewSpots] = useState<PreviewSpot[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function respond(accept: boolean) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/collections/${invite.collectionId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accept }),
        },
      );
      if (res.ok) onRespond(invite.collectionId, accept);
    } finally {
      setLoading(false);
    }
  }

  async function togglePreview() {
    if (previewing) {
      setPreviewing(false);
      return;
    }
    setPreviewing(true);
    if (previewSpots !== null) return; // already fetched
    setPreviewLoading(true);
    try {
      const slug = invite.collectionSlug ?? invite.collectionId;
      const res = await fetch(`/api/collections/${slug}/spots`);
      if (res.ok) {
        const data = await res.json();
        setPreviewSpots(data.spots ?? []);
      } else {
        setPreviewSpots([]);
      }
    } catch {
      setPreviewSpots([]);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:ring-white/5 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0">
          {invite.owner.image ? (
            <Image
              src={invite.owner.image}
              alt=""
              width={40}
              height={40}
              className="rounded-full shrink-0 ring-2 ring-amber-500/30"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-pink-500/30 shrink-0 grid place-items-center text-sm font-bold text-zinc-400">
              {(invite.owner.name ?? invite.owner.username ?? "?")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p
              className={`${quicksand.className} text-xs tracking-wide text-zinc-400 dark:text-zinc-500`}
            >
              <span className="text-pink-500 dark:text-pink-400 font-semibold">
                @{invite.owner.username ?? "unknown"}
              </span>{" "}
              invited you to
            </p>
            <p
              className={`${quicksand.className} text-lg font-bold truncate bg-gradient-to-r from-pink-400 to-yellow-300 bg-clip-text text-transparent`}
            >
              {invite.collectionName}
            </p>
            <span
              className={`${quicksand.className} inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5`}
            >
              {invite.spotCount} spots
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={togglePreview}
            className={`rounded-full p-3 transition-colors ${
              previewing
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            title={previewing ? "Hide preview" : "Preview collection"}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {previewing ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
          <button
            onClick={() => respond(true)}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-pink-400 to-yellow-300 px-4 py-2 text-sm font-semibold text-black shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-60 transition-all"
          >
            Accept
          </button>
          <button
            onClick={() => respond(false)}
            disabled={loading}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Decline
          </button>
        </div>
      </div>

      {/* ── Inline collection preview ── */}
      {previewing && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4">
          {previewLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : previewSpots && previewSpots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {previewSpots.slice(0, 8).map((s) => (
                <Link
                  key={s.id}
                  href={`/spot/${s.slug}`}
                  className="group relative block overflow-hidden rounded-xl aspect-square"
                >
                  {s.coverUrl ? (
                    <Image
                      src={s.coverUrl}
                      alt={s.title}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="120px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 grid place-items-center text-zinc-400 text-xs">
                      No image
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[11px] font-medium text-white line-clamp-1 drop-shadow">
                      {s.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-4">
              No spots in this collection yet.
            </p>
          )}
          {previewSpots && previewSpots.length > 8 && (
            <p className="text-xs text-zinc-400 text-center mt-2">
              +{previewSpots.length - 8} more spots
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function InvitesPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { data: session } = useSession();
  const viewerName = session?.user?.name ?? session?.user?.email ?? undefined;
  const viewerAvatar = session?.user?.image ?? undefined;
  // Pending invites (client-side)
  type Invite = {
    id: string;
    collectionId: string;
    collectionName: string;
    collectionSlug: string | null;
    spotCount: number;
    owner: {
      username: string | null;
      name: string | null;
      image: string | null;
    };
  };
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me/invites")
      .then((r) => r.json())
      .then((d) => setInvites(d.invites ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function handleInviteRespond(collectionId: string, _accept: boolean) {
    setInvites((prev) => prev.filter((i) => i.collectionId !== collectionId));
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head>
        <title>Invites</title>
        <meta name="description" content="Your pending collection invites" />
        <link rel="canonical" href="/invites" />
      </Head>

      <HeaderWithMenu displayName={viewerName} avatarUrl={viewerAvatar} />
      <div className="h-16 sm:h-[72px]" />

      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-32 md:pb-16 md:ml-72 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold sm:text-3xl flex items-center gap-3">
            <svg
              className="h-6 w-6 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Invites
          </h1>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            ← Back
          </Link>
        </div>

        {/* ── Pending invites ── */}
        {loaded && invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
              No pending invites
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              When someone invites you to a collection, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <InviteCard
                key={inv.id}
                invite={inv}
                onRespond={handleInviteRespond}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
