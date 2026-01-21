import Image from "next/image";
import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";

export type SpotCardProps = {
  spot: {
    id: string;
    slug?: string | null;
    title: string;
    coverUrl?: string | null;
    city?: string | null;
    country?: string | null;
  };
};

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <Link
      href={`/spot/${spot.slug ?? spot.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <div className="relative w-full pt-[130%]">
        {spot.coverUrl ? (
          <Image
            src={spot.coverUrl}
            alt={spot.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-zinc-400">
            No image
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 sm:p-2.5">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <Magnetic
            strength={0.5}
            className="relative z-10 inline-block pointer-events-auto"
          >
            <div className="inline-flex flex-col gap-1 rounded-xl bg-black/35 px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
              <div className="text-[13px] font-medium text-white/95 drop-shadow">
                {spot.title}
              </div>
              {(spot.city || spot.country) && (
                <div className="text-[11px] text-white/85 drop-shadow-sm">
                  {[spot.city, spot.country].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </Magnetic>
        </div>

        <div className="absolute inset-0 ring-0 ring-white/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/30" />
      </div>
    </Link>
  );
}
