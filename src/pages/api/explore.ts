// /pages/api/explore.ts
export const config = { api: { bodyParser: false } };

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

type Pin = {
  id: string;
  slug: string;
  title: string;
  mediaUrl: string;
  width?: number | null;
  height?: number | null;
  location?: string;
  kind: "image";
  user: { name: string; avatar: string };
  likes: number;
  comments: number;
  tags?: string[] | undefined;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const limit = Math.min(Number(req.query.limit) || 24, 60);
  const cursor = (req.query.cursor as string) || null;
  const q = (req.query.q as string) || "";
  const tag = (req.query.tag as string) || "";

  // WHERE builder for your schema
  // - title/city/country are strings
  // - tags is JSON array of strings
  const where: any = {};

  if (q) {
    where.OR = [
      { title: { contains: q, lte: "insensitive" } },
      { city: { contains: q, lte: "insensitive" } },
      { country: { contains: q, lte: "insensitive" } },
      // loose match against tags: try to see if any tag contains 'q'
      // Prisma doesn't support "contains" within JSON strings,
      // but we can attempt equality when user types an exact tag.
      { tags: { array_contains: q } },
    ];
  }

  if (tag) {
    // filter by exact tag membership
    where.tags = { array_contains: tag };
  }

  try {
    const takePlusOne = limit + 1;

    const results = await prisma.spot.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        city: true,
        country: true,
        coverUrl: true,
        image: true,
        tags: true,
        createdAt: true,
        author: { select: { name: true, image: true } },
        _count: { select: { likes: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: takePlusOne,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = results.length > limit;
    const slice = results.slice(0, limit);

    const items: Pin[] = slice.map((s) => {
      const location =
        [s.city, s.country].filter(Boolean).join(", ") || undefined;

      // tags come as JSON: normalize to string[]
      const tags = Array.isArray(s.tags)
        ? (s.tags as unknown as string[]).map((t) => String(t))
        : undefined;

      return {
        id: s.id,
        slug: s.slug || s.id,
        title: s.title ?? "Untitled",
        mediaUrl: s.coverUrl || s.image, // prefer cover if present
        width: null, // not in schema (keep shape for client UI)
        height: null, // not in schema
        kind: "image",
        user: {
          name: s.author?.name ?? "Unknown",
          avatar:
            s.author?.image ??
            "https://api.dicebear.com/8.x/identicon/svg?seed=explore",
        },
        location,
        likes: s._count.likes ?? 0,
        comments: 0, // no comments model in schema
        tags,
      };
    });

    const nextCursor = hasMore ? (slice[slice.length - 1]?.id ?? null) : null;
    res.status(200).json({ items, nextCursor });
  } catch (e: unknown) {
    console.error(e);
    res
      .status(500)
      .json({
        error: "Unexpected error",
        detail: e instanceof Error ? e.message : String(e),
      });
  }
}
