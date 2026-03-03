// pages/api/spots/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const userId = (session?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const spotId = req.query.id as string;

  // Only author can delete
  const spot = await prisma.spot.findFirst({
    where: { id: spotId, authorId: userId },
    select: { id: true },
  });
  if (!spot)
    return res.status(404).json({ error: "Spot not found or not author" });

  // Cascade handles CollectionSpot, Like, Save, Visit, Comment cleanup
  await prisma.spot.delete({ where: { id: spotId } });

  return res.json({ ok: true });
}
