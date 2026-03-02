// pages/api/me/invites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const userId = (session?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const invites = await prisma.collectionMember.findMany({
    where: { userId, status: "pending" },
    orderBy: { invitedAt: "desc" },
    select: {
      id: true,
      invitedAt: true,
      collection: {
        select: {
          id: true,
          name: true,
          slug: true,
          user: { select: { username: true, name: true, image: true } },
          _count: { select: { spots: true } },
        },
      },
    },
  });

  const items = invites.map((inv) => ({
    id: inv.id,
    collectionId: inv.collection.id,
    collectionName: inv.collection.name,
    collectionSlug: inv.collection.slug,
    spotCount: inv.collection._count.spots,
    owner: inv.collection.user,
    invitedAt: inv.invitedAt.toISOString(),
  }));

  return res.json({ invites: items });
}
