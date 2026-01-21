// components/SaveToCollectionSheet.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type SpotMini = { id: string; title: string };
type Collection = { id: string; name: string; count: number };

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function useMyCollectionsLite() {
  return useQuery({
    queryKey: ["me", "collections", "lite"],
    queryFn: () =>
      getJSON<{ items: Collection[] }>("/api/me/collections").then((v) => ({
        items: v.items.map((c) => ({ id: c.id, name: c.name, count: c.count })),
      })),
  });
}
/* =========================
   Save Intent Toast (3s, pauses on hover)
========================= */
export function SaveIntentToast({
  spot,
  onYes,
  onTimeout,
}: {
  spot: SpotMini | null;
  onYes: () => void;
  onTimeout: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingMsRef = useRef(3000);
  const deadlineRef = useRef<number | null>(null);

  // Start / reset the countdown whenever a new spot arrives
  useEffect(() => {
    clearTimer();
    if (!spot) return;
    remainingMsRef.current = 3000;
    startTimer(remainingMsRef.current);
    // cleanup on unmount or spot change
    return clearTimer;
  }, [spot]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (ms: number) => {
    deadlineRef.current = Date.now() + ms;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onTimeout();
    }, ms);
  };

  const handleMouseEnter = () => {
    // pause
    if (!spot) return;
    if (deadlineRef.current) {
      const left = Math.max(0, deadlineRef.current - Date.now());
      remainingMsRef.current = left;
    }
    clearTimer();
  };

  const handleMouseLeave = () => {
    // resume
    if (!spot) return;
    const left = Math.max(0, remainingMsRef.current);
    if (left === 0) {
      onTimeout();
    } else {
      startTimer(left);
    }
  };

  return (
    <AnimatePresence>
      {spot && (
        <motion.div
          key={spot.id}
          className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-[min(92vw,560px)]"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          role="dialog"
          aria-live="polite"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between rounded-2xl bg-zinc-900/80 px-4 py-3 text-white backdrop-blur ring-1 ring-white/15 dark:bg-zinc-900/85">
            <div className="min-w-0 pr-3">
              <div className="truncate text-sm">
                Save <span className="font-semibold">“{spot.title}”</span> to a
                collection?
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={onYes}
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
              >
                Choose…
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================
   Save Sheet (unchanged API; +onSaved)
========================= */
export function SaveToCollectionSheet({
  open,
  spot,
  onClose,
  onSaved, // NEW (optional)
}: {
  open: boolean;
  spot: SpotMini | null;
  onClose: () => void;
  onSaved?: () => void; // call when a save succeeds
}) {
  const qc = useQueryClient();
  const { data } = useMyCollectionsLite();
  const [query, setQuery] = useState("");

  // add spot to existing collection
  const addMut = useMutation({
    mutationFn: async (vars: { collectionId: string; spotId: string }) => {
      const r = await fetch("/api/collections/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as { ok: true };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me", "collections"] });
      await qc.invalidateQueries({ queryKey: ["me", "collections", "lite"] });
      await qc.invalidateQueries({ queryKey: ["me", "saved"] }); // Also invalidate saved list
      onSaved?.(); // 👈 fire success animation outside
      onClose();
    },
  });

  // create collection (if needed) AND save the spot in one go
  const createAndSaveMut = useMutation({
    mutationFn: async (vars: { name: string; spotId: string }) => {
      const r = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars), // { name, spotId }
      });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as {
        id: string;
        name: string;
        count: number;
        saved: boolean;
      };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me", "collections"] });
      await qc.invalidateQueries({ queryKey: ["me", "collections", "lite"] });
      await qc.invalidateQueries({ queryKey: ["me", "saved"] }); // Also invalidate saved list
      onSaved?.(); // 👈 fire success animation outside
      onClose();
    },
  });

  const list = useMemo(() => {
    const items = data?.items ?? [];
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [data?.items, query]);

  return (
    <AnimatePresence>
      {open && spot && (
        <>
          {/* scrim */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-zinc-900 sm:w-[540px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              Save{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                “{spot.title}”
              </span>{" "}
              to…
            </div>

            {/* optional search (wired to state already) */}
            <div className="mb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter collections…"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            {/* list */}
            <div className="max-h-64 overflow-y-auto pr-1">
              {list.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    spot &&
                    addMut.mutate({ collectionId: c.id, spotId: spot.id })
                  }
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  disabled={addMut.isPending || createAndSaveMut.isPending}
                >
                  <span className="truncate text-sm">{c.name}</span>
                  <span className="text-xs text-zinc-500">{c.count} items</span>
                </button>
              ))}

              {list.length === 0 && (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No matching collections.
                </div>
              )}
            </div>

            {/* create & save */}
            <div className="mt-4 flex gap-2">
              <input
                id="__new_collection_name"
                placeholder="New collection name"
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && spot) {
                    const name = (
                      e.currentTarget as HTMLInputElement
                    ).value.trim();
                    if (name) {
                      createAndSaveMut.mutate({ name, spotId: spot.id });
                    }
                  }
                }}
              />
              <button
                disabled={createAndSaveMut.isPending || !spot}
                onClick={() => {
                  const el = document.getElementById(
                    "__new_collection_name"
                  ) as HTMLInputElement | null;
                  const name = el?.value?.trim();
                  if (name && spot) {
                    createAndSaveMut.mutate({ name, spotId: spot.id });
                  }
                }}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {createAndSaveMut.isPending ? "Saving…" : "Create & Save"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ========= cute burst shown once on swipe-right ========= */
export function SaveBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* badge */}
          <motion.div
            initial={{ scale: 0.6, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md ring-1 ring-white/20"
          >
            Saved
          </motion.div>

          {/* confetti dots */}
          {[...Array(30)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-2 w-2 rounded-full bg-white/80"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 160,
                y: -80 - Math.random() * 80,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 + Math.random() * 0.2 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
