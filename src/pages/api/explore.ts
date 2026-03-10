// /pages/api/explore.ts
export const config = { api: { bodyParser: false } };

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

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
  exploreReason?: string;
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
        { tags: { array_contains: q.toLowerCase() } },
      ];
    }
    if (tag) {
      where.tags = { array_contains: tag };
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
    // Advanced algorithm for empty query
    const results: any[] = [];
    let remainingLimit = limit;

    console.log(
      `\n--- [EXPLORE API] New Request for user: ${userId || "Anonymous"} ---`,
    );
    console.log(`- Requested Limit: ${limit}`);
    console.log(`- Seen IDs count: ${seenIds.length}`);

    const baseExclude = userId
      ? {
          authorId: { not: userId },
          saves: { none: { userId } },
          skips: { none: { userId } },
        }
      : {};

    const baseWhere = {
      ...baseExclude,
      ...(seenIds.length > 0 ? { id: { notIn: seenIds } } : {}),
    };

    if (userId) {
      // 1. Tags / Interests (30%) Let's calculate count
      const tagTarget = Math.floor(limit * 0.3);
      const recentSaves = await prisma.save.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { spot: { select: { tags: true } } },
      });

      const userTags = new Set<string>();
      for (const s of recentSaves) {
        if (Array.isArray(s.spot.tags)) {
          s.spot.tags.forEach((t) => userTags.add(String(t).toLowerCase()));
        }
      }

      if (userTags.size > 0 && remainingLimit > 0) {
        // Prisma JSON array_contains doesn't support IN nicely, so we use OR
        const conditions = Array.from(userTags).map((t) => ({
          tags: { array_contains: t },
        }));

        const tagSpots = await prisma.spot.findMany({
          where: { ...baseWhere, OR: conditions },
          select: SPOT_SELECT,
          orderBy: { createdAt: "desc" },
          take: tagTarget,
        });

        console.log(
          `[Tier 1: Tags] Target: ${tagTarget}, Found: ${tagSpots.length}`,
          tagSpots.map((s) => s.title),
        );
        const enriched = tagSpots.map((s) => ({
          ...s,
          exploreReason: "🎯 Vybráno algoritmem podle tvých zájmů",
        }));
        results.push(...enriched);
        remainingLimit -= tagSpots.length;
        tagSpots.forEach((s) => seenIds.push(s.id));
        baseWhere.id = { notIn: seenIds };
      } else {
        console.log(`[Tier 1: Tags] Skipped - No recent saves with tags`);
      }

      // 2. Following (30%)
      const followTarget =
        Math.floor(limit * 0.3) + (tagTarget - results.length); // rollover unused limit
      if (followTarget > 0 && remainingLimit > 0) {
        const following = await prisma.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);

        if (followingIds.length > 0) {
          const followSpots = await prisma.spot.findMany({
            where: { ...baseWhere, authorId: { in: followingIds } },
            select: SPOT_SELECT,
            orderBy: { createdAt: "desc" },
            take: Math.min(followTarget, remainingLimit),
          });

          console.log(
            `[Tier 2: Followings] Target: ${followTarget}, Found: ${followSpots.length}`,
            followSpots.map((s) => s.title),
          );
          const enriched = followSpots.map((s) => ({
            ...s,
            exploreReason: "👥 Přidáno někým, koho sleduješ",
          }));
          results.push(...enriched);
          remainingLimit -= followSpots.length;
          followSpots.forEach((s) => seenIds.push(s.id));
          baseWhere.id = { notIn: seenIds };
        } else {
          console.log(
            `[Tier 2: Followings] Skipped - User doesn't follow anyone`,
          );
        }
      }
    }

    // 3. Discovery (New spots - tries to fill remaining limit up to ~85%)
    const discoveryTarget = Math.max(
      1,
      remainingLimit - Math.max(1, Math.floor(limit * 0.15)),
    );
    if (discoveryTarget > 0 && remainingLimit > 0) {
      const discoverySpots = await prisma.spot.findMany({
        where: baseWhere,
        select: SPOT_SELECT,
        orderBy: { createdAt: "desc" },
        take: Math.min(discoveryTarget, remainingLimit),
      });

      console.log(
        `[Tier 3: Discovery] Target: ${discoveryTarget}, Found: ${discoverySpots.length}`,
        discoverySpots.map((s) => s.title),
      );
      const enriched = discoverySpots.map((s) => ({
        ...s,
        exploreReason: "🌍 Úplně nové místo k prozkoumání",
      }));
      results.push(...enriched);
      remainingLimit -= discoverySpots.length;
      discoverySpots.forEach((s) => seenIds.push(s.id));
    }

    // 4. Recycled / Own Spots (fallback to fill the rest of the limit)
    // Here we explicitly REMOVE the `baseWhere` restrictions on saves/skips/own spots
    // We only exclude `seenIds` so we don't send what the client currently holds in memory this session
    if (remainingLimit > 0) {
      const recycledSpots = await prisma.spot.findMany({
        where: { ...(seenIds.length > 0 ? { id: { notIn: seenIds } } : {}) },
        select: SPOT_SELECT,
        // Order randomly if possible, or fallback to creation time
        // Prisma doesn't support native random ordering easily without raw queries
        // So we grab a slightly larger pool and shuffle it in memory
        orderBy: { id: "desc" },
        take: remainingLimit * 3, // overfetch slightly
      });

      // Simple in-memory shuffle to pick random recycled spots
      const shuffled = recycledSpots.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, remainingLimit);

      console.log(
        `[Tier 4: Recycled] Needed: ${remainingLimit}, Found: ${selected.length}`,
        selected.map((s) => s.title),
      );
      const enriched = selected.map((s) => ({
        ...s,
        exploreReason: "♻️ Recyklované nebo dříve viděné místo",
      }));
      results.push(...enriched);
      remainingLimit -= selected.length;
    }

    console.log(
      `--- [EXPLORE API END] Total Returned: ${results.length} ---\n`,
    );

    const items = formatSpots(results);

    // We don't need nextCursor anymore because we rely on POSTing seenIds
    // The client will just keep asking for more until items.length === 0
    res.status(200).json({ items, nextCursor: null });
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
  author: { select: { name: true, image: true } },
  _count: { select: { likes: true } },
};

function formatSpots(slice: any[]): Pin[] {
  return slice.map((s) => {
    const location =
      [s.city, s.country].filter(Boolean).join(", ") || undefined;

    const tags = Array.isArray(s.tags)
      ? (s.tags as unknown as string[]).map((t) => String(t))
      : undefined;

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
      },
      location,
      likes: s._count.likes ?? 0,
      comments: 0,
      tags,
      exploreReason: s.exploreReason,
    };
  });
}
