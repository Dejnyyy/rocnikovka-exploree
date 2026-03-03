// pages/api/collections/[id].ts
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

  const collectionId = req.query.id as string;

  // Only owner can delete
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!col)
    return res.status(404).json({ error: "Collection not found or not owner" });

  // Cascade handles CollectionSpot + CollectionMember cleanup
  await prisma.collection.delete({ where: { id: collectionId } });

  return res.json({ ok: true });
}
