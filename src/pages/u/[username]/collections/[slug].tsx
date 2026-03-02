// pages/u/[username]/collections/[slug].tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import prisma from "@/lib/prisma";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { PinCard } from "@/components/PinCard";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import React, { useState } from "react";

type SpotItem = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
};

/* ── Visibility toggle (owner-only) ────────────────────────────── */
function VisibilitySwitch({
  collectionId,
  initialIsPublic,
}: {
  collectionId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    try {
      setLoading(true);
      const next = !isPublic;
      setIsPublic(next);
      const res = await fetch(`/api/collections/${collectionId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) setIsPublic(!next);
    } catch {
      setIsPublic(isPublic);
    } finally {
      setLoading(false);
    }
  }

  /* Globe icon */
  const GlobeIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );

  /* Lock icon */
  const LockIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      onClick={toggle}
      disabled={loading}
      className={`
        group relative inline-flex items-center gap-1.5
        rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide
        transition-all duration-300 ease-out select-none
        ${loading ? "opacity-60 pointer-events-none" : "cursor-pointer"}
        ${
          isPublic
            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/30 hover:ring-emerald-400/50 hover:from-emerald-500/30 hover:to-teal-500/30 dark:from-emerald-500/15 dark:to-teal-500/15"
            : "bg-zinc-800/60 text-zinc-400 ring-1 ring-zinc-700/50 hover:ring-zinc-500/50 hover:bg-zinc-700/60 hover:text-zinc-300"
        }
      `}
      title={isPublic ? "Click to make private" : "Click to make public"}
    >
      <span
        className={`transition-transform duration-300 ${loading ? "animate-pulse" : ""}`}
      >
        {isPublic ? <GlobeIcon /> : <LockIcon />}
      </span>
      <span className="uppercase">
        {loading ? "…" : isPublic ? "Public" : "Private"}
      </span>
    </button>
  );
}

/* ── Members panel (owner-only) ───────────────────────────────── */
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

  // Fetch members on mount
  useState(() => {
    fetch(`/api/collections/${collectionId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => {});
  });

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
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
    <div className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
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
          className="text-violet-500"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Members
      </h2>

      {/* Invite input with autocomplete */}
      <div ref={wrapperRef} className="relative mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search @username…"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && inviteUser(query)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            onClick={() => inviteUser(query)}
            disabled={inviting || !query.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
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
        <p className="text-sm text-zinc-400">No members yet. Invite someone!</p>
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
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
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

  /* resolve session to check ownership */
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const viewerId = (session?.user as { id: string } | undefined)?.id ?? null;
  const isOwner = !!viewerId && viewerId === user.id;

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

  /* Private collections: owner or accepted member can see them */
  if (!collection) return { notFound: true };
  let isMember = false;
  if (!collection.isPublic && !isOwner) {
    if (viewerId) {
      const membership = await prisma.collectionMember.findFirst({
        where: {
          collectionId: collection.id,
          userId: viewerId,
          status: "accepted",
        },
        select: { id: true },
      });
      isMember = !!membership;
    }
    if (!isMember) return { notFound: true };
  }

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
        isPublic: collection.isPublic,
        createdAt: collection.createdAt.toISOString(),
        items: collection.spots.map((cs) => cs.spot),
      },
      isOwner,
    },
  };
};

export default function CollectionDetailPage({
  profile,
  collection,
  isOwner,
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
              <div className="mt-3 flex items-center gap-3 flex-wrap">
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

                {/* Owner-only visibility switch */}
                {isOwner && (
                  <>
                    <span
                      aria-hidden
                      className="text-zinc-300 dark:text-zinc-700"
                    >
                      •
                    </span>
                    <VisibilitySwitch
                      collectionId={collection.id}
                      initialIsPublic={collection.isPublic}
                    />
                  </>
                )}

                {/* Non-owner private badge */}
                {!isOwner && !collection.isPublic && (
                  <>
                    <span
                      aria-hidden
                      className="text-zinc-300 dark:text-zinc-700"
                    >
                      •
                    </span>
                    <span className="rounded-full bg-zinc-200/60 px-2 py-0.5 text-xs dark:bg-zinc-800/60">
                      Private
                    </span>
                  </>
                )}
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

        {/* Owner-only members panel */}
        {isOwner && <MembersPanel collectionId={collection.id} />}
      </main>
    </div>
  );
}
