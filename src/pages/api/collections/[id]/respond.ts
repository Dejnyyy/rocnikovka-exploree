// pages/api/collections/[id]/respond.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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
  const { accept } = req.body as { accept?: boolean };
  if (typeof accept !== "boolean")
    return res.status(400).json({ error: "accept must be boolean" });

  // Find the pending membership for this user
  const membership = await prisma.collectionMember.findUnique({
    where: { collectionId_userId: { collectionId, userId } },
  });
  if (!membership || membership.status !== "pending")
    return res.status(404).json({ error: "No pending invite found" });

  // Enforce max 10 collaborators when accepting (race-condition guard)
  if (accept) {
    const acceptedCount = await prisma.collectionMember.count({
      where: { collectionId, status: "accepted" },
    });
    if (acceptedCount >= 10)
      return res
        .status(400)
        .json({
          error: "Collection already has the maximum of 10 collaborators",
        });
  }

  const updated = await prisma.collectionMember.update({
    where: { id: membership.id },
    data: {
      status: accept ? "accepted" : "declined",
      respondedAt: new Date(),
    },
    select: { id: true, status: true },
  });

  return res.json({ ok: true, membership: updated });
}
