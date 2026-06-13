// /pages/api/explore.ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { selectRecycled } from "@/lib/feed";

type Pin = {
  id: string;
  slug: string;
  title: string;
  mediaUrl: string;
  width?: number | null;
  height?: number | null;
  location?: string;
  kind: "image";
  user: { name: string; avatar: string; handle?: string };
  likes: number;
  comments: number;
  tags?: string[] | undefined;
  exploreReason?: string;
  authorId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const userId = session?.user?.id;

  const body = req.method === "POST" ? req.body : {};
  const seenIds: string[] = Array.isArray(body?.seenIds) ? body.seenIds : [];

  const limit = Math.min(Number(req.query.limit || body?.limit || 24), 60);

  // If there's an explicit search query/tag from old UI, just do a basic fetch
  const q = (req.query.q as string) || (body?.q as string) || "";
  const tag = (req.query.tag as string) || (body?.tag as string) || "";

  if (q || tag) {
    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { city: { contains: q } },
        { country: { contains: q } },
        { tags: { contains: q.toLowerCase() } },
      ];
    }
    if (tag) {
      where.tags = { contains: tag };
    }
    const results = await prisma.spot.findMany({
      where,
      select: SPOT_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });
    return res
      .status(200)
      .json({ items: formatSpots(results), nextCursor: null });
  }

  try {
    const results: any[] = [];
    let remaining = limit;

    console.log(
      `\n--- [EXPLORE] user=${userId || "anon"} limit=${limit} seen=${seenIds.length} ---`,
    );

    // Common "not already interacted" filter for logged-in users
    const notInteracted = userId
      ? {
          authorId: { not: userId },
          saves: { none: { userId } },
          skips: { none: { userId } },
        }
      : {};

    // Exclude IDs the client already has in this session
    const notSeen = seenIds.length > 0 ? { id: { notIn: seenIds } } : {};

    // ─── TIER 1: Unseen spots from people you follow ───
    if (userId && remaining > 0) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);

      if (followingIds.length > 0) {
        const friendSpots = await prisma.spot.findMany({
          where: {
            ...notInteracted,
            ...notSeen,
            authorId: { in: followingIds },
          },
          select: SPOT_SELECT,
          orderBy: { createdAt: "desc" },
          take: remaining,
        });

        console.log(
          `[T1 Friends] ${friendSpots.length}/${remaining}`,
          friendSpots.map((s) => s.title),
        );

        const enriched = friendSpots.map((s) => ({
          ...s,
          exploreReason: "👥 Od někoho, koho sleduješ",
        }));
        results.push(...enriched);
        remaining -= friendSpots.length;
        friendSpots.forEach((s) => seenIds.push(s.id));
      }
    }

    // ─── TIER 2: Unseen spots from everyone else ───
    if (remaining > 0) {
      const discoverySpots = await prisma.spot.findMany({
        where: {
          ...notInteracted,
          ...(seenIds.length > 0 ? { id: { notIn: seenIds } } : {}),
        },
        select: SPOT_SELECT,
        orderBy: { createdAt: "desc" },
        take: remaining,
      });

      console.log(
        `[T2 Discovery] ${discoverySpots.length}/${remaining}`,
        discoverySpots.map((s) => s.title),
      );

      const enriched = discoverySpots.map((s) => ({
        ...s,
        exploreReason: "🌍 Nové místo k prozkoumání",
      }));
      results.push(...enriched);
      remaining -= discoverySpots.length;
      discoverySpots.forEach((s) => seenIds.push(s.id));
    }

    // ─── TIER 3: Recycled (already seen/saved/skipped, shuffled) ───
    // Never excludes the full global seen list — only the ids already in THIS
    // response (seenIds, which T1/T2 pushed into) — so the deck never starves.
    if (remaining > 0) {
      const pool = await prisma.spot.findMany({
        where: userId ? { authorId: { not: userId } } : {},
        select: SPOT_SELECT,
        orderBy: { id: "desc" },
        take: Math.max(remaining * 5, 50),
      });

      const selected = selectRecycled(pool, seenIds, remaining);

      console.log(`[T3 Recycled] ${selected.length}/${remaining}`);

      const enriched = selected.map((s) => ({
        ...s,
        exploreReason: "♻️ Znovu objevené místo",
      }));
      results.push(...enriched);
      remaining -= selected.length;
    }

    console.log(`--- [EXPLORE END] returned=${results.length} ---\n`);

    res.status(200).json({ items: formatSpots(results), nextCursor: null });
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({
      error: "Unexpected error",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

// Helper to keep selection consistent
const SPOT_SELECT = {
  id: true,
  slug: true,
  title: true,
  city: true,
  country: true,
  coverUrl: true,
  image: true,
  tags: true,
  createdAt: true,
  author: { select: { id: true, name: true, image: true, username: true } },
  _count: { select: { likes: true } },
};

function formatSpots(slice: any[]): Pin[] {
  return slice.map((s) => {
    const location =
      [s.city, s.country].filter(Boolean).join(", ") || undefined;

    let tags: string[] | undefined;
    if (Array.isArray(s.tags)) {
      tags = s.tags.map((t: unknown) => String(t));
    } else if (typeof s.tags === "string" && s.tags.length > 0) {
      try {
        const parsed = JSON.parse(s.tags);
        tags = Array.isArray(parsed)
          ? parsed.map((t: unknown) => String(t))
          : undefined;
      } catch {
        tags = undefined;
      }
    }

    return {
      id: s.id,
      slug: s.slug || s.id,
      title: s.title ?? "Untitled",
      mediaUrl: s.coverUrl || s.image,
      width: null,
      height: null,
      kind: "image",
      user: {
        name: s.author?.name ?? "Unknown",
        avatar:
          s.author?.image ??
          "https://api.dicebear.com/8.x/identicon/svg?seed=explore",
        handle: s.author?.username ?? undefined,
      },
      location,
      likes: s._count.likes ?? 0,
      comments: 0,
      tags,
      exploreReason: s.exploreReason,
      authorId: s.author?.id ?? "",
    };
  });
}
