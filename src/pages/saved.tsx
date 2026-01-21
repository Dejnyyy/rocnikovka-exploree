// pages/saved.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { useMySaved } from "@/hooks/me";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PinCard } from "@/components/PinCard";
import { useEffect, useRef } from "react";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type MySavedData = NonNullable<ReturnType<typeof useMySaved>["data"]>;
type SpotItem = MySavedData["items"][number];

function GridPins({ items }: { items: SpotItem[] }) {
  // Debug log
  console.log(`[GridPins] Rendering ${items.length} items`);

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

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function SavedPageInner() {
  const { data: session } = useSession();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["me", "saved"],
    queryFn: ({ pageParam }) => {
      const url = pageParam
        ? `/api/me/saved?cursor=${pageParam}&limit=50`
        : `/api/me/saved?limit=50`;
      return getJSON<{
        items: SpotItem[];
        nextCursor?: string | null;
      }>(url);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 0, // Force refetch to clear cache
    gcTime: 0, // Don't cache at all
  });

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  // Debug log
  useEffect(() => {
    if (data) {
      console.log(
        `[saved frontend] Total pages: ${data.pages.length}, Total items: ${allItems.length}`,
      );
      data.pages.forEach((page, idx) => {
        console.log(
          `[saved frontend] Page ${idx + 1}: ${page.items.length} items`,
        );
      });
    }
  }, [data, allItems.length]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-32 md:pb-8 md:ml-72 pt-28">
      <div className="w-full">
        <div className="mb-6">
          <h1 className={`${quicksand.className} text-3xl font-bold`}>Saved</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            All your saved spots
          </p>
        </div>

        <div className="min-h-[200px]">
          {isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading saved spots…
            </p>
          ) : allItems.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No saved spots yet
            </p>
          ) : (
            <>
              <GridPins items={allItems} />
              {hasNextPage && <div ref={loadMoreRef} className="mt-6 h-10" />}
              {isFetchingNextPage && (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading more…
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SavedPage() {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 0, // Don't cache
          },
        },
      }),
  );
  const { data: session } = useSession();

  return (
    <QueryClientProvider client={qc}>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <HeaderWithMenu
          avatarUrl={session?.user?.image ?? undefined}
          displayName={(session?.user?.name ?? session?.user?.email) as string}
        />
        <SavedPageInner />
      </div>
    </QueryClientProvider>
  );
}
