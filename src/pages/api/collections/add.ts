// pages/api/collections/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth"; // <-- import Session
import { authOptions } from "../auth/[...nextauth]"; // typed NextAuthOptions
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Make the type explicit so TS knows session is Session | null
  const session = (await getServerSession(
    req,
    res,
    authOptions
  )) as Session | null;
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { collectionId, spotId } = req.body as {
    collectionId?: string;
    spotId?: string;
  };
  if (!collectionId || !spotId)
    return res.status(400).json({ error: "Missing params" });

  // ownership check
  const owns = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!owns) return res.status(404).json({ error: "Collection not found" });

  await prisma.collectionSpot.upsert({
    where: { collectionId_spotId: { collectionId, spotId } },
    update: {},
    create: { collectionId, spotId },
  });

  return res.json({ ok: true });
}
