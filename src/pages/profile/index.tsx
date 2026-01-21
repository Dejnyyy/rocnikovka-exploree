// pages/profile/index.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
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

function GridPins({ items }: { items: SpotItem[] }) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
      {items.map((s) => (
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
  );
}

function GridCollections({ items }: { items: ColItem[] }) {
  const { data: session } = useSession();
  const username =
    (session?.user as { username?: string } | undefined)?.username || "";

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
      {items.map((c) => (
        <CollectionPinCard
          key={c.id}
          id={c.id}
          name={c.name}
          slug={c.slug}
          coverUrl={c.coverUrl}
          count={c.count}
          username={username}
        />
      ))}
    </div>
  );
}

function ProfileOverviewInner() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"Spots" | "Collections">("Spots");

  const spotsQ = useMySpots();
  const colsQ = useMyCollections();

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
          ) : (colsQ.data?.items ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="mb-2 text-lg font-semibold">No collections yet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Create a collection to organize your favorite spots!
              </p>
            </div>
          ) : (
            <GridCollections items={colsQ.data?.items ?? []} />
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
