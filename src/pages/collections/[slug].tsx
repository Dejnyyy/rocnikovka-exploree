// pages/collections/[slug].tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import React, { useState } from "react";
import { useSession } from "next-auth/react";

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

// Members panel (owner-only)
function MembersPanel({ collectionId }: { collectionId: string }) {
  type Member = {
    id: string;
    status: string;
    user: {
      id: string;
      username: string | null;
      name: string | null;
      image: string | null;
    };
  };
  type Suggestion = {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
  };

  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch(`/api/collections/${collectionId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => {});
  }, [collectionId]);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    setError("");
    setSuccess("");
    const clean = val.replace(/^@/, "").trim();
    if (clean.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(clean)}`)
        .then((r) => r.json())
        .then((d) => {
          setSuggestions(d.users ?? []);
          setShowDropdown((d.users ?? []).length > 0);
        })
        .catch(() => {});
    }, 300);
  }

  async function inviteUser(uname: string) {
    if (!uname.trim()) return;
    setInviting(true);
    setError("");
    setSuccess("");
    setShowDropdown(false);
    try {
      const res = await fetch(`/api/collections/${collectionId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname.replace(/^@/, "").trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invite failed");
        return;
      }
      setSuccess(`Invited @${data.member?.username ?? uname}`);
      setQuery("");
      setSuggestions([]);
      const r2 = await fetch(`/api/collections/${collectionId}/members`);
      const d2 = await r2.json();
      setMembers(d2.members ?? []);
    } catch {
      setError("Something went wrong");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    await fetch(`/api/collections/${collectionId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setMembers((prev) => prev.filter((m) => m.user.id !== userId));
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-500",
    accepted: "bg-emerald-500/20 text-emerald-400",
    declined: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="mt-10 rounded-2xl p-5">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-pink-500"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Collaborators
      </h2>
      <div ref={wrapperRef} className="relative mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search @username…"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && inviteUser(query)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
          <button
            onClick={() => inviteUser(query)}
            disabled={inviting || !query.trim()}
            className="rounded-lg bg-gradient-to-r from-pink-400 to-yellow-300 px-4 py-2 text-sm font-medium text-black hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {inviting ? "…" : "Invite"}
          </button>
        </div>
        {showDropdown && (
          <div className="absolute z-20 left-0 right-12 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
            {suggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => inviteUser(u.username ?? "")}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {u.image ? (
                  <img
                    src={u.image}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0 grid place-items-center text-[10px] font-bold text-zinc-500">
                    {(u.name ?? u.username ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate text-zinc-900 dark:text-zinc-100">
                    {u.name ?? `@${u.username}`}
                  </div>
                  {u.name && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      @{u.username}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {success && <p className="text-xs text-emerald-500 mb-3">{success}</p>}
      {members.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No collaborators yet. Invite someone!
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {m.user.image ? (
                  <img
                    src={m.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                )}
                <span className="text-sm font-medium truncate">
                  @{m.user.username ?? "unknown"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColors[m.status] ?? "bg-zinc-500/20 text-zinc-400"}`}
                >
                  {m.status}
                </span>
              </div>
              <button
                onClick={() => removeMember(m.user.id)}
                className="text-sm text-red-400  hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
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

        {/* Owner-only members panel */}
        {isOwner && <MembersPanel collectionId={col.id} />}
      </main>
    </div>
  );
}
