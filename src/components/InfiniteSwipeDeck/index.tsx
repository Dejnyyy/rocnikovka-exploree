"use client";

import { SwipeDeck, type Spot } from "@/components/SwipeDeck";
import { useInfiniteShuffledSpots } from "@/hooks/useInfiniteShuffledSpots";

type InfiniteSwipeDeckProps = {
  spots: Spot[];
  onSave: (s: Spot) => Promise<void> | void;
  onSkip: (s: Spot) => Promise<void> | void;
  onFetchMore?: () => void;
  className?: string;
};

/**
 * Wrapper around SwipeDeck that provides:
 * - Random order shuffling of spots
 * - Infinite swiping (reshuffles and provides new batch when reaching the end)
 */
export function InfiniteSwipeDeck({
  spots,
  onSave,
  onSkip,
  onFetchMore,
  className,
}: InfiniteSwipeDeckProps) {
  const { spots: shuffledSpots, getNextBatch } = useInfiniteShuffledSpots(
    spots,
    onFetchMore
  );

  // Handle when SwipeDeck runs out of spots or is getting low
  const handleEmpty = () => {
    getNextBatch();
  };

  // If no spots available, show loading state
  if (shuffledSpots.length === 0) {
    return (
      <div
        className={`relative h-[72vh] w-[min(92vw,420px)] flex items-center justify-center ${
          className ?? ""
        }`}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading places…
        </p>
      </div>
    );
  }

  return (
    <SwipeDeck
      spots={shuffledSpots}
      onSave={onSave}
      onSkip={onSkip}
      onEmpty={handleEmpty}
      className={className}
    />
  );
}
