/** Keep only the most recent `max` ids, de-duplicated (last occurrence wins). */
export function trimRecentlySeen(ids: string[], max: number): string[] {
  const seen = new Set<string>();
  const reversedUnique: string[] = [];
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i];
    if (!seen.has(id)) {
      seen.add(id);
      reversedUnique.push(id);
    }
  }
  const unique = reversedUnique.reverse();
  return unique.length <= max ? unique : unique.slice(unique.length - max);
}

/**
 * Pick up to `limit` items from `pool`, excluding `excludeIds`, shuffled.
 * If excluding empties the candidate set but the pool is non-empty, fall back
 * to the whole pool so the deck never starves.
 * `rng` defaults to Math.random; injectable for tests.
 */
export function selectRecycled<T extends { id: string }>(
  pool: T[],
  excludeIds: string[],
  limit: number,
  rng: () => number = Math.random,
): T[] {
  const exclude = new Set(excludeIds);
  let candidates = pool.filter((s) => !exclude.has(s.id));
  if (candidates.length === 0 && pool.length > 0) {
    candidates = [...pool];
  }
  const shuffled = [...candidates].sort(() => 0.5 - rng());
  return shuffled.slice(0, limit);
}

/**
 * Pull the next batch of spots to display in the swipe deck.
 *
 * Normally the batch comes from `queue` (genuinely unseen spots). When the
 * queue is empty we recycle from `allKnown` (every spot ingested so far,
 * reshuffled) so a finite set of spots still feels like an infinite deck and
 * the deck never goes blank. Returns the chosen batch plus the leftover queue.
 *
 * `shuffle` is injectable for deterministic tests; defaults to a copy (no-op
 * order) — callers pass a real shuffle in production.
 */
export function takeDeckBatch<T>(
  queue: T[],
  allKnown: T[],
  batchSize: number,
  shuffle: (arr: T[]) => T[] = (arr) => [...arr],
): { batch: T[]; queue: T[] } {
  // Recycle known spots when the queue has run dry.
  const source = queue.length > 0 ? queue : shuffle(allKnown);
  const take = Math.min(batchSize, source.length);
  return { batch: source.slice(0, take), queue: source.slice(take) };
}
