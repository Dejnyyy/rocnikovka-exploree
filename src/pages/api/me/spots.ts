// pages/api/me/spots.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // <-- adjust path if needed
import prisma from "@/lib/prisma"; // <-- adjust path
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

  const take = Math.min(Number(req.query.limit) || 24, 60);
  const cursor = (req.query.cursor as string) || null;

  try {
    const rows = await prisma.spot.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    let nextCursor: string | null = null;
    if (rows.length > take) {
      nextCursor = rows[rows.length - 1].id;
      rows.pop();
    }

    const items = rows.map((s) => ({
      id: s.id,
      title: s.title,
      coverUrl: s.coverUrl ?? s.image, // fallback to required `image`
      city: s.city ?? null,
      country: s.country ?? null,
      lat: s.lat,
      lng: s.lng,
      slug: s.slug,
      createdAt: s.createdAt,
    }));

    res.json({ items, nextCursor });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch spots" });
  }
}
