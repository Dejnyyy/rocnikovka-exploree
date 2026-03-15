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
 * Custom hook that manages infinite swiping with random order.
 *
 * How it works:
 *  - `spots` from the parent (react-query pages) are the *full* flat list
 *    returned by all fetched pages so far.
 *  - We keep a `queueRef` of spots waiting to be shown, and a `displayedSpots`
 *    array that SwipeDeck renders from.
 *  - When spots arrive we add genuinely new ones to the queue (deduped).
 *  - When SwipeDeck calls `onEmpty`, we pull the next batch from the queue,
 *    shuffle it, and append it to displayedSpots.
 *  - If the queue is running low, we call `onFetchMore` to ask the parent for
 *    more data from the API (which sends `seenIds` to avoid server-side dupes).
 */
export function useInfiniteShuffledSpots(
  spots: Spot[],
  onFetchMore?: () => void,
  batchSize: number = 20,
) {
  // Queue of unseen spots ready to be shown next
  const queueRef = useRef<Spot[]>([]);
  // Set of all IDs we have ever ingested (from API pages)
  const knownIdsRef = useRef<Set<string>>(new Set());
  // Displayed spots – what SwipeDeck renders
  const [displayedSpots, setDisplayedSpots] = useState<Spot[]>([]);
  const initializedRef = useRef(false);
  const isReshufflingRef = useRef(false);

  // ------- Ingest new spots from API into the queue -------
  useEffect(() => {
    if (spots.length === 0) return;

    // Find spots we haven't ingested yet
    const fresh: Spot[] = [];
    for (const s of spots) {
      if (!knownIdsRef.current.has(s.id)) {
        knownIdsRef.current.add(s.id);
        fresh.push(s);
      }
    }

    if (fresh.length > 0) {
      queueRef.current.push(...fresh);
    }

    // First load → immediately show an initial batch
    if (!initializedRef.current && queueRef.current.length > 0) {
      const shuffled = shuffleArray(queueRef.current);
      const initialBatch = shuffled.splice(
        0,
        Math.min(batchSize * 3, shuffled.length),
      );
      queueRef.current = shuffled; // remainder stays in queue
      setDisplayedSpots(initialBatch);
      initializedRef.current = true;

      // Pre-fetch more if the queue is already low
      if (queueRef.current.length < batchSize && onFetchMore) {
        onFetchMore();
      }
    }
  }, [spots, batchSize, onFetchMore]);

  // ------- Pull next batch from the queue (called by SwipeDeck.onEmpty) -------
  const getNextBatch = useCallback(() => {
    if (isReshufflingRef.current) return;
    isReshufflingRef.current = true;

    requestAnimationFrame(() => {
      // Ask for more data if the queue is low
      if (queueRef.current.length < batchSize * 2 && onFetchMore) {
        onFetchMore();
      }

      if (queueRef.current.length === 0) {
        // Nothing in queue — can't do anything until API responds
        isReshufflingRef.current = false;
        return;
      }

      // Shuffle the queue and grab a batch
      const shuffled = shuffleArray(queueRef.current);
      const nextBatch = shuffled.splice(
        0,
        Math.min(batchSize * 2, shuffled.length),
      );
      queueRef.current = shuffled; // put the rest back

      setDisplayedSpots((prev) => [...prev, ...nextBatch]);

      setTimeout(() => {
        isReshufflingRef.current = false;
      }, 50);
    });
  }, [batchSize, onFetchMore]);

  return {
    spots: displayedSpots,
    getNextBatch,
    totalSpots: queueRef.current.length,
    seenCount: knownIdsRef.current.size,
  };
}
