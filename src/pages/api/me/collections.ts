// pages/api/me/collections.ts
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
  const userId = (session?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const cols = await prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublic: true,
        _count: { select: { spots: true } },
        spots: {
          take: 1,
          orderBy: { addedAt: "desc" },
          select: {
            spot: {
              select: {
                coverUrl: true,
                image: true,
                title: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
    });

    const items = cols.map((c) => {
      const newest = c.spots[0]?.spot;
      const derivedCover = newest?.coverUrl ?? newest?.image ?? null;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        isPublic: c.isPublic,
        count: c._count.spots,
        coverUrl: derivedCover,
      };
    });

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
}
