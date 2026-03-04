// pages/profile/index.tsx
"use client";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { useMySpots, useMyCollections } from "@/hooks/me";
import Link from "next/link";
import { CollectionPinCard } from "@/components/CollectionPinCard";
type MySpotsData = NonNullable<ReturnType<typeof useMySpots>["data"]>;
type SpotItem = MySpotsData["items"][number];

type MyColsData = NonNullable<ReturnType<typeof useMyCollections>["data"]>;
type ColItem = MyColsData["items"][number];

import { PinCard } from "@/components/PinCard";

/* ── Confirm dialog ──────────────────────────── */
function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {message}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-full px-4 py-1.5 text-sm font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-full px-4 py-1.5 text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Trash button ──────────────────────────── */
function TrashButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
      title="Delete"
    >
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
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    </button>
  );
}

/* ── Spots grid with delete ──────────────────────────── */
function GridPins({ items }: { items: SpotItem[] }) {
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/spots/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => {
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const confirmSpot = items.find((s) => s.id === confirmId);

  return (
    <>
      <ConfirmDialog
        open={!!confirmId}
        title="Delete spot?"
        message={
          <>
            <span className="font-bold underline text-zinc-900 dark:text-zinc-100">
              {confirmSpot?.title ?? "This spot"}
            </span>{" "}
            will be permanently removed from all collections.
          </>
        }
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        onCancel={() => setConfirmId(null)}
        loading={deleteMut.isPending}
      />
      <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
        {items.map((s) => (
          <div key={s.id} className="relative group">
            <TrashButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmId(s.id);
              }}
            />
            <PinCard
              id={s.id}
              slug={s.slug}
              title={s.title}
              mediaUrl={s.coverUrl || ""}
              city={s.city}
              country={s.country}
            />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Collections grid with delete ──────────────────────────── */
function GridCollections({ items }: { items: ColItem[] }) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const username =
    (session?.user as { username?: string } | undefined)?.username || "";
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => {
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const confirmCol = items.find((c) => c.id === confirmId);

  return (
    <>
      <ConfirmDialog
        open={!!confirmId}
        title="Delete collection?"
        message={
          <>
            <span className="font-bold underline text-zinc-900 dark:text-zinc-100">
              {confirmCol?.name ?? "This collection"}
            </span>{" "}
            and all its memberships will be permanently deleted. The spots
            inside will not be deleted.
          </>
        }
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        onCancel={() => setConfirmId(null)}
        loading={deleteMut.isPending}
      />
      <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
        {items.map((c) => (
          <div key={c.id} className="relative group">
            <TrashButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmId(c.id);
              }}
            />
            <CollectionPinCard
              id={c.id}
              name={c.name}
              slug={c.slug}
              coverUrl={c.coverUrl}
              count={c.count}
              username={username}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function ProfileOverviewInner() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"Spots" | "Collections">("Spots");

  const spotsQ = useMySpots();
  const colsQ = useMyCollections();

  const [inviteCount, setInviteCount] = useState(0);
  useEffect(() => {
    fetch("/api/me/invites")
      .then((r) => r.json())
      .then((d) => setInviteCount((d.invites ?? []).length))
      .catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-32 md:pb-8 md:ml-72 pt-28">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Left: avatar + names */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <div className="text-xl font-semibold">
                {session?.user?.name ?? session?.user?.email}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                @{session?.user?.username}
              </div>
            </div>
          </div>

          {/* Right: edit button */}
          <Link
            href="/profile/settings"
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Edit profile
          </Link>
        </div>

        {inviteCount > 0 && (
          <Link
            href="/invites"
            className="mb-6 flex items-center justify-between rounded-2xl bg-amber-500/10 px-4 py-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-sm font-medium">
                You have {inviteCount} pending collection{" "}
                {inviteCount === 1 ? "invite" : "invites"}
              </span>
            </div>
            <span className="text-sm font-semibold underline underline-offset-2">
              View
            </span>
          </Link>
        )}

        <div className="mb-4 flex gap-2">
          {(["Spots", "Collections"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm border ${
                tab === t
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {tab === "Spots" ? (
            spotsQ.isLoading ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Loading spots…
              </p>
            ) : (spotsQ.data?.items ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <h3 className="mb-2 text-lg font-semibold">No spots yet</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Start exploring and add your first spot!
                </p>
              </div>
            ) : (
              <GridPins items={spotsQ.data?.items ?? []} />
            )
          ) : colsQ.isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading collections…
            </p>
          ) : (colsQ.data?.items ?? []).length === 0 &&
            (colsQ.data?.shared ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="mb-2 text-lg font-semibold">No collections yet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Create a collection to organize your favorite spots!
              </p>
            </div>
          ) : (
            <>
              {(colsQ.data?.items ?? []).length > 0 && (
                <GridCollections items={colsQ.data?.items ?? []} />
              )}
              {(colsQ.data?.shared ?? []).length > 0 && (
                <>
                  <h3 className="mt-6 mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Shared with you
                  </h3>
                  <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
                    {(colsQ.data?.shared ?? []).map((c) => (
                      <CollectionPinCard
                        key={c.id}
                        id={c.id}
                        name={c.name}
                        slug={c.slug}
                        coverUrl={c.coverUrl}
                        count={c.count}
                        username={c.ownerUsername ?? ""}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProfileOverviewPage() {
  const [qc] = useState(() => new QueryClient());
  const { data: session } = useSession();

  return (
    <QueryClientProvider client={qc}>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <HeaderWithMenu
          avatarUrl={session?.user?.image ?? undefined}
          displayName={(session?.user?.name ?? session?.user?.email) as string}
        />
        <ProfileOverviewInner />
      </div>
    </QueryClientProvider>
  );
}
