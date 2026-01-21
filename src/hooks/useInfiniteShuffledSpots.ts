import { useRef, useState, useCallback, useEffect } from "react";
import type { Spot } from "@/components/SwipeDeck";

/**
 * Fisher-Yates shuffle algorithm for randomizing array order
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Custom hook that manages infinite swiping with random order
 * - Optimized for large datasets (10k+ spots)
 * - Uses sliding window to limit memory usage
 * - Dynamically fetches spots as needed
 * - Shuffles spots randomly from available pool
 */
export function useInfiniteShuffledSpots(
  spots: Spot[],
  onFetchMore?: () => void,
  batchSize: number = 20,
  maxPoolSize: number = 200 // Maximální velikost poolu pro optimalizaci paměti
) {
  // Sliding window pool - udržujeme jen omezený počet spotů v paměti
  const poolRef = useRef<Spot[]>([]);
  const [displayedSpots, setDisplayedSpots] = useState<Spot[]>([]);
  const isReshufflingRef = useRef(false);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set()); // Track co už jsme viděli

  // Helper: Maintain sliding window - remove oldest spots when pool gets too large
  const maintainPoolSize = useCallback(
    (newSpots: Spot[]) => {
      // Add new spots to pool
      poolRef.current = [...poolRef.current, ...newSpots];

      // Track seen IDs
      newSpots.forEach((spot) => seenIdsRef.current.add(spot.id));

      // If pool exceeds max size, remove oldest spots (sliding window)
      if (poolRef.current.length > maxPoolSize) {
        const toRemove = poolRef.current.length - maxPoolSize;
        poolRef.current = poolRef.current.slice(toRemove);
      }
    },
    [maxPoolSize]
  );

  // When new spots arrive from API, add them to pool
  useEffect(() => {
    if (spots.length === 0) return;

    const isInitialLoad = !initializedRef.current;

    // Filter out spots we've already seen
    const newSpots = spots.filter((s) => !seenIdsRef.current.has(s.id));

    if (newSpots.length > 0) {
      // Add to pool with sliding window management
      maintainPoolSize(newSpots);
    } else if (isInitialLoad && spots.length > 0) {
      // Initial load - add all spots
      maintainPoolSize(spots);
    }

    // Only create initial batch on first load
    if (isInitialLoad && poolRef.current.length > 0) {
      // ALWAYS shuffle on initial load to ensure random order
      const shuffled = shuffleArray(poolRef.current);
      // Start with a larger initial batch to avoid immediate preloading
      const initialBatch = shuffled.slice(
        0,
        Math.min(batchSize * 3, shuffled.length)
      );
      setDisplayedSpots(initialBatch);
      initializedRef.current = true;
    }
  }, [spots, batchSize, maintainPoolSize]);

  // Preload next batch when running low
  const preloadNextBatch = useCallback(() => {
    // If pool is empty or very low, fetch more from API
    if (poolRef.current.length < batchSize) {
      if (onFetchMore) {
        onFetchMore();
      }
      // Still try to use what we have
      if (poolRef.current.length === 0) {
        return;
      }
    }

    if (isReshufflingRef.current) return;
    isReshufflingRef.current = true;

    // Use requestAnimationFrame to ensure smooth updates
    requestAnimationFrame(() => {
      // Shuffle only the current pool (not all 10k spots!)
      const shuffled = shuffleArray(poolRef.current);
      const nextBatch = shuffled.slice(
        0,
        Math.min(batchSize * 2, shuffled.length)
      );

      // Append to existing spots - allow cycling through spots infinitely
      setDisplayedSpots((prev) => {
        // Get the last few spots to avoid immediate repeats
        const recentIds = new Set(prev.slice(-batchSize).map((s) => s.id));
        // Filter out spots that were just shown (to avoid immediate repeats)
        const filteredBatch = nextBatch.filter((s) => !recentIds.has(s.id));

        // If all spots were recently shown, just use the shuffled batch anyway
        // This ensures infinite cycling
        const spotsToAdd = filteredBatch.length > 0 ? filteredBatch : nextBatch;

        return [...prev, ...spotsToAdd];
      });

      // Fetch more spots from API if pool is getting low
      // Dynamicky fetchujeme když máme málo spotů v poolu
      if (poolRef.current.length < batchSize * 2 && onFetchMore) {
        onFetchMore();
      }

      setTimeout(() => {
        isReshufflingRef.current = false;
      }, 50);
    });
  }, [batchSize, onFetchMore]);

  // Get next batch when current one is exhausted (called by SwipeDeck's onEmpty)
  const getNextBatch = useCallback(() => {
    // Always preload more spots when onEmpty is called
    // This ensures smooth infinite scrolling
    preloadNextBatch();
  }, [preloadNextBatch]);

  // Proactively preload when displayed spots are getting low
  // This ensures we always have spots ready before the user reaches the end
  useEffect(() => {
    // Only preload if we have spots but the displayed list is getting short
    // This keeps a healthy buffer without causing infinite loops
    if (
      displayedSpots.length > 0 &&
      displayedSpots.length < batchSize * 2 &&
      poolRef.current.length > 0 &&
      !isReshufflingRef.current
    ) {
      // Use a small delay to avoid immediate re-triggering
      const timeoutId = setTimeout(() => {
        if (!isReshufflingRef.current) {
          preloadNextBatch();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [displayedSpots.length, batchSize, preloadNextBatch]);

  return {
    spots: displayedSpots,
    getNextBatch,
    totalSpots: poolRef.current.length, // Current pool size (not all 10k!)
    seenCount: seenIdsRef.current.size, // Total unique spots seen
  };
}
