import Image from "next/image";
import Link from "next/link";
import { Quicksand } from "next/font/google";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
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
import CommentSection from "@/components/CommentSection";
import { trimRecentlySeen } from "@/lib/feed";
import ConsentModal from "@/components/ConsentModal";
import { hasPendingConsent, clearPendingConsent } from "@/components/ConsentGate";
import ConsentGate from "@/components/ConsentGate";

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
  exploreReason?: string;
  authorId?: string;
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
  exploreReason?: string;
  authorId?: string;
};
type ExploreResponse = {
  items: ExplorePin[];
  nextCursor: string | null;
};

type ExplorePageParam = {
  cursor?: string;
  seenIds?: string[];
};

// Fetcher for paginated API - optimalizováno pro velké množství dat
// Načítáme menší dávky (15 spotů) pro lepší výkon a dynamické fetchování
async function fetchExplorePage(
  pageParam?: ExplorePageParam,
): Promise<ExploreResponse> {
  const params = new URLSearchParams({ limit: "15" });
  if (pageParam?.cursor) params.set("cursor", pageParam.cursor);

  const res = await fetch(`/api/explore?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seenIds: pageParam?.seenIds ?? [],
    }),
  });

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
        className={`${quicksand.className} relative min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden`}
      >
        {/* background glows (matches onboarding) */}
        <div className="pointer-events-none fixed inset-0">
          <div
            className="absolute -top-32 -left-24 h-72 w-72 rounded-full blur-3xl opacity-20 dark:opacity-40"
            style={{ background: "radial-gradient(closest-side, #8e79ff, transparent)" }}
          />
          <div
            className="absolute top-20 right-[-6rem] h-80 w-80 rounded-full blur-3xl opacity-20 dark:opacity-40"
            style={{ background: "radial-gradient(closest-side, #f17ea7, transparent)" }}
          />
          <div
            className="absolute bottom-[-8rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-15 dark:opacity-30"
            style={{ background: "radial-gradient(closest-side, #fcd77f, transparent)" }}
          />
        </div>

        <main className="relative z-10 mx-auto max-w-5xl px-6">
          {/* Hero */}
          <section className="flex flex-col items-center text-center pt-20 pb-16 gap-6">
            <Image src="/logos/exploree.png" alt="Exploree logo" width={160} height={160} priority />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Discover places worth the trip.
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              Swipe through real spots shared by real people, save the ones you love
              into collections, and follow explorers with great taste.
            </p>
            <div className="mt-2">
              <ConsentGate />
            </div>
          </section>

          {/* How it works */}
          <section className="py-12">
            <h2 className="text-center text-2xl font-bold mb-8">How it works</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { n: "1", t: "Swipe to explore", d: "Browse a never-ending deck of places. Skip what's not for you, keep what is." },
                { n: "2", t: "Save to collections", d: "Organize your favourite spots into collections you can revisit and share." },
                { n: "3", t: "Follow explorers", d: "Follow people whose taste you trust and see their newest finds first." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 backdrop-blur">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 text-sm font-semibold text-black">
                    {s.n}
                  </div>
                  <h3 className="font-semibold mb-1">{s.t}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feature highlights */}
          <section className="py-12">
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { t: "A swipe deck that never runs dry", d: "Endless discovery, fresh places first, favourites resurfaced." },
                { t: "Collections", d: "Group spots into public or private collections." },
                { t: "Map view", d: "See where every place sits on the map." },
                { t: "Profiles", d: "A public page for everything you've shared." },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 backdrop-blur">
                  <h3 className="font-semibold mb-1">{f.t}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center justify-center gap-4">
              <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Privacy Policy</Link>
              <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Cookies</Link>
              <a href="mailto:support@exploree.dejny.eu" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Contact</a>
            </div>
            <p className="mt-4">© {new Date().getFullYear()} Exploree</p>
          </footer>
        </main>
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

  const [needsConsent, setNeedsConsent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasPendingConsent()) {
        await fetch("/api/consent", { method: "POST" }).catch(() => {});
        clearPendingConsent();
      }
      const res = await fetch("/api/consent").catch(() => null);
      if (!res || cancelled) return;
      const data = await res.json().catch(() => null);
      if (data && !data.consentedAt) setNeedsConsent(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    ExplorePageParam | undefined
  >({
    queryKey: ["explore", { limit: 15 }],
    queryFn: ({ pageParam }) => fetchExplorePage(pageParam),
    initialPageParam: undefined, // ✅ required in v5
    getNextPageParam: (lastPage, allPages) => {
      // Only send a bounded window of recently-seen ids so the server prefers
      // fresh content first but can always recycle older spots. We never return
      // undefined, so the deck keeps requesting forever.
      const allSeenIds = allPages.flatMap((p) => p.items.map((i) => i.id));
      const recentlySeen = trimRecentlySeen(allSeenIds, 30);
      return {
        cursor: lastPage.nextCursor ?? undefined,
        seenIds: recentlySeen,
      };
    },
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
        exploreReason: p.exploreReason,
        authorId: p.authorId,
      };
    });

  const [currentSpotId, setCurrentSpotId] = useState<string | null>(null);
  const [currentSpotAuthorId, setCurrentSpotAuthorId] = useState<string | null>(null);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);

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
        <div className="mx-auto flex w-full max-w-5xl items-start justify-center gap-8">
          {/* Swipe deck */}
          <div className="flex items-center justify-center">
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
                onCardChange={(s) => {
                  setCurrentSpotId(s?.id ?? null);
                  setCurrentSpotAuthorId(s?.authorId ?? null);
                  if (s) {
                    console.log(
                      `%c[Explore Deck] 📍 ${s.title}`,
                      "color: #ff00ff; font-weight: bold; font-size: 14px;",
                    );
                    console.log(
                      `%c   -> ${s.exploreReason || "Neznámý (starý formát nebo fallback)"}`,
                      "color: #00ffff; font-style: italic;",
                    );
                  }
                }}
                onCommentPosted={() => setCommentRefreshKey((k) => k + 1)}
              />
            )}
          </div>

          {/* Comment panel — desktop only, beside the swipe card */}
          {currentSpotId && (
            <div className="hidden lg:flex flex-col w-80 flex-shrink-0 sticky top-28 max-h-[75vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 backdrop-blur-sm">
              <CommentSection
                key={currentSpotId}
                spotId={currentSpotId}
                className="flex-1 min-h-0"
                refreshKey={commentRefreshKey}
                spotAuthorId={currentSpotAuthorId ?? undefined}
              />
            </div>
          )}
        </div>

        {isFetchingNextPage && (
          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Loading more…
          </div>
        )}
      </main>
      {needsConsent && <ConsentModal onAccept={() => setNeedsConsent(false)} />}
    </div>
  );
}
