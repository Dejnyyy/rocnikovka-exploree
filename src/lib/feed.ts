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
