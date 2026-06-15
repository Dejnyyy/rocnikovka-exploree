import { describe, it, expect } from "vitest";
import { trimRecentlySeen, selectRecycled, takeDeckBatch } from "./feed";

describe("takeDeckBatch", () => {
  const identity = <T,>(a: T[]) => [...a];

  it("draws from the queue first when it has items", () => {
    const { batch, queue } = takeDeckBatch(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      2,
      identity,
    );
    expect(batch.map((s) => s.id)).toEqual(["a", "b"]);
    expect(queue.map((s) => s.id)).toEqual(["c"]);
  });

  it("recycles known spots when the queue is empty (the deck must never starve)", () => {
    // This is the bug: previously an empty queue returned nothing and the
    // deck went blank, even though there were known spots to recycle.
    const { batch, queue } = takeDeckBatch(
      [],
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      2,
      identity,
    );
    expect(batch.map((s) => s.id)).toEqual(["a", "b"]);
    expect(queue.map((s) => s.id)).toEqual(["c"]);
  });

  it("returns nothing only when there is genuinely nothing to show", () => {
    const { batch, queue } = takeDeckBatch([], [], 5, identity);
    expect(batch).toEqual([]);
    expect(queue).toEqual([]);
  });

  it("never returns more than batchSize", () => {
    const { batch } = takeDeckBatch(
      [],
      [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      2,
      identity,
    );
    expect(batch).toHaveLength(2);
  });
});

describe("trimRecentlySeen", () => {
  it("returns all ids when under the limit", () => {
    expect(trimRecentlySeen(["a", "b"], 5)).toEqual(["a", "b"]);
  });

  it("keeps only the most recent ids when over the limit", () => {
    expect(trimRecentlySeen(["a", "b", "c", "d"], 2)).toEqual(["c", "d"]);
  });

  it("dedupes while keeping last occurrence order", () => {
    expect(trimRecentlySeen(["a", "b", "a", "c"], 10)).toEqual(["b", "a", "c"]);
  });
});

describe("selectRecycled", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

  it("excludes recently-seen ids", () => {
    const out = selectRecycled(pool, ["a", "b"], 10, () => 0);
    expect(out.map((s) => s.id)).not.toContain("a");
    expect(out.map((s) => s.id)).not.toContain("b");
  });

  it("returns at most `limit` items", () => {
    const out = selectRecycled(pool, [], 2, () => 0);
    expect(out).toHaveLength(2);
  });

  it("returns items from the pool when nothing is excluded", () => {
    const out = selectRecycled(pool, [], 10, () => 0);
    expect(out).toHaveLength(4);
  });

  it("falls back to the full pool when everything is excluded but pool is non-empty", () => {
    const out = selectRecycled(pool, ["a", "b", "c", "d"], 2, () => 0);
    expect(out).toHaveLength(2);
  });
});
