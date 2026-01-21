// pages/api/me/saved.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const session = (await getServerSession(
    req,
    res,
    authOptions
  )) as Session | null;
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const take = Math.min(Number(req.query.limit) || 50, 100);
  const cursor = (req.query.cursor as string) || null;

  try {
    // Only get spots from CollectionSpot where collection belongs to user
    // Saved spots must be in a collection to appear in /saved
    const collectionSpots = await prisma.collectionSpot.findMany({
      where: {
        collection: {
          userId,
        },
      },
      select: {
        spotId: true,
        addedAt: true,
      },
      orderBy: {
        addedAt: "desc",
      },
    });

    // Deduplicate by spotId, keeping the earliest save date
    const spotMap = new Map<string, { spotId: string; savedAt: Date }>();

    collectionSpots.forEach((cs) => {
      const existing = spotMap.get(cs.spotId);
      if (!existing || cs.addedAt < existing.savedAt) {
        spotMap.set(cs.spotId, { spotId: cs.spotId, savedAt: cs.addedAt });
      }
    });

    const savedSpotIds = Array.from(spotMap.values())
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
      .map((s) => s.spotId);

    // Find cursor position
    let skip = 0;
    if (cursor) {
      const cursorIndex = savedSpotIds.indexOf(cursor);
      if (cursorIndex >= 0) {
        skip = cursorIndex + 1;
      }
    }

    // Get the spots
    const spotIdsToFetch = savedSpotIds.slice(skip, skip + take + 1);
    const rows = await prisma.spot.findMany({
      where: {
        id: { in: spotIdsToFetch },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        country: true,
        coverUrl: true,
        image: true,
        lat: true,
        lng: true,
        createdAt: true,
      },
    });

    // Sort rows by the order in savedSpotIds
    const sortedRows = rows.sort((a, b) => {
      const aIndex = savedSpotIds.indexOf(a.id);
      const bIndex = savedSpotIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Limit to take items (not take + 1, as we already sliced spotIdsToFetch)
    const limitedRows = sortedRows.slice(0, take);

    let nextCursor: string | null = null;
    if (spotIdsToFetch.length > take) {
      nextCursor = spotIdsToFetch[take];
    }

    const items = limitedRows.map((s) => ({
      id: s.id,
      title: s.title,
      coverUrl: s.coverUrl ?? s.image,
      city: s.city ?? null,
      country: s.country ?? null,
      lat: s.lat,
      lng: s.lng,
      slug: s.slug,
      createdAt: s.createdAt,
    }));

    console.log(`[saved] Returning ${items.length} items (take=${take}, skip=${skip}, totalSaved=${savedSpotIds.length})`);

    res.json({ items, nextCursor });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch saved spots" });
  }
}
