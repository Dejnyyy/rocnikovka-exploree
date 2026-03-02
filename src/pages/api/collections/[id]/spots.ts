// pages/api/collections/[id]/spots.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id as string;

  // Try finding by ID first, then by slug
  let collection = await prisma.collection.findUnique({
    where: { id },
    select: { id: true, isPublic: true },
  });

  if (!collection) {
    const bySlug = await prisma.collection.findFirst({
      where: { slug: id },
      select: { id: true, isPublic: true },
    });
    collection = bySlug;
  }

  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }

  const spots = await prisma.collectionSpot.findMany({
    where: { collectionId: collection.id },
    orderBy: { addedAt: "desc" },
    select: {
      spot: {
        select: {
          id: true,
          title: true,
          coverUrl: true,
          image: true,
          city: true,
          country: true,
          slug: true,
        },
      },
    },
  });

  const items = spots.map((cs) => ({
    id: cs.spot.id,
    title: cs.spot.title,
    coverUrl: cs.spot.coverUrl ?? cs.spot.image ?? null,
    city: cs.spot.city ?? null,
    country: cs.spot.country ?? null,
    slug: cs.spot.slug,
  }));

  return res.json({ spots: items });
}
