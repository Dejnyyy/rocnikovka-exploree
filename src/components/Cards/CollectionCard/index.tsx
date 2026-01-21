import Image from "next/image";
import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";
export type CollectionCardProps = {
  col: {
    id: string;
    name: string;
    slug: string | null;
    coverUrl: string | null;
    count: number;
  };
  username: string; // přidaný prop
};

export function CollectionCard({ col, username }: CollectionCardProps) {
  return (
    <Link
      href={`/u/${username}/collections/${col.slug ?? col.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <div className="relative w-full pt-[60%]">
        {col.coverUrl ? (
          <Image
            src={col.coverUrl}
            alt={col.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-zinc-400">
            No cover
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 sm:p-2.5">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <Magnetic
            strength={0.5}
            className="relative z-10 inline-block pointer-events-auto"
          >
            <div className="inline-flex flex-col gap-0.5 rounded-xl bg-black/35 px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
              <div className="text-[13px] font-medium text-white/95 drop-shadow">
                {col.name}
              </div>
              <div className="text-[11px] text-white/85 drop-shadow-sm">
                {col.count} items
              </div>
            </div>
          </Magnetic>
        </div>

        <div className="absolute inset-0 ring-0 ring-white/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/30" />
      </div>
    </Link>
  );
}
