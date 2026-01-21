import Image from "next/image";
import Link from "next/link";
import { Quicksand } from "next/font/google";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  InfiniteData,
} from "@tanstack/react-query";
import { InfiniteSwipeDeck } from "@/components/InfiniteSwipeDeck";
import HeaderWithMenu from "@/components/HeaderWithMenu";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Type expected by SwipeDeck
type Spot = {
  id: string;
  title: string;
  coverUrl?: string;
  city?: string;
  country?: string;
  author?: {
    name: string;
    image?: string | null;
    username?: string | null;
  } | null;
};

// API response types
type ExplorePin = {
  id: string;
  title: string;
  mediaUrl: string;
  location?: string; // "City, Country"
  user?: {
    name: string;
    avatar: string;
    handle?: string;
  };
};
type ExploreResponse = {
  items: ExplorePin[];
  nextCursor: string | null;
};

// Fetcher for paginated API - optimalizováno pro velké množství dat
// Načítáme menší dávky (15 spotů) pro lepší výkon a dynamické fetchování
async function fetchExplorePage(cursor?: string): Promise<ExploreResponse> {
  const params = new URLSearchParams({ limit: "15" });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/explore?${params.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Home() {
  const { data: session, status } = useSession();
  const [qc] = useState(() => new QueryClient());

  if (status === "loading") {
    return (
      <div
        className={`${quicksand.className} min-h-screen grid place-items-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Checking session…
        </p>
      </div>
    );
  }
  if (!session) {
    return (
      <div
        className={`${quicksand.className} relative min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        {/* Foreground content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <Image
            src="/logos/exploree.png"
            alt="Exploree logo"
            width={240}
            height={240}
            priority
          />
          <div className="rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 p-[3px]">
            <button
              onClick={() => signIn("google")}
              className="w-full rounded-full px-8 py-3 text-base cursor-pointer
                         bg-black text-white
                         hover:bg-gradient-to-r hover:from-pink-400 hover:to-yellow-300
                         hover:text-black font-semibold transition-all"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={qc}>
      <AuthedHome />
    </QueryClientProvider>
  );
}

function AuthedHome() {
  const { data: session } = useSession();

  // Infinite query for explore spots
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    ExploreResponse,
    Error,
    InfiniteData<ExploreResponse>,
    (string | { limit: number })[],
    string | undefined
  >({
    queryKey: ["explore", { limit: 15 }],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchExplorePage(pageParam),
    initialPageParam: undefined, // ✅ required in v5
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  // Flatten pages into a list of Spot
  const spots: Spot[] = (data?.pages ?? [])
    .flatMap((p) => (p as ExploreResponse).items)
    .map((p: ExplorePin) => {
      let city: string | undefined;
      let country: string | undefined;
      if (p.location?.includes(",")) {
        const [c1, c2] = p.location.split(",").map((s: string) => s.trim());
        city = c1 || undefined;
        country = c2 || undefined;
      }
      return {
        id: p.id,
        title: p.title || "Untitled",
        coverUrl: p.mediaUrl,
        city,
        country,
        author: p.user
          ? {
              name: p.user.name,
              image: p.user.avatar,
              username: p.user.handle ?? null,
            }
          : null,
      };
    });

  const queryClient = useQueryClient();
  const saveMut = useMutation({
    mutationFn: async (s: Spot) =>
      fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: s.id }),
      }),
    onSuccess: () => {
      // Invalidate saved query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["me", "saved"] });
    },
  });

  const skipMut = useMutation({
    mutationFn: async (s: Spot) =>
      fetch("/api/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: s.id }),
      }),
  });

  return (
    <div
      className={`${quicksand.className} min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden`}
    >
      <HeaderWithMenu
        avatarUrl={session?.user?.image ?? undefined}
        displayName={
          (session?.user?.name ?? session?.user?.email ?? "U") as string
        }
      />

      <main className="px-4 sm:px-6 pt-24 pb-32 md:pb-6 md:ml-72 overscroll-y-contain">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center">
          {isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading places…
            </p>
          ) : isError ? (
            <p className="text-sm text-red-500">Failed to load places.</p>
          ) : spots.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No places yet. Add some spots to explore.
            </p>
          ) : (
            <InfiniteSwipeDeck
              spots={spots}
              onSave={(s) => saveMut.mutate(s)}
              onSkip={(s) => skipMut.mutate(s)}
              onFetchMore={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
            />
          )}
        </div>

        {isFetchingNextPage && (
          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Loading more…
          </div>
        )}
      </main>
    </div>
  );
}
