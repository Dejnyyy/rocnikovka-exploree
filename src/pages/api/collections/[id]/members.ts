// pages/api/collections/[id]/members.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const userId = (session?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const collectionId = req.query.id as string;

  // Only owner can view/manage members
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!col)
    return res.status(404).json({ error: "Collection not found or not owner" });

  // GET — list members
  if (req.method === "GET") {
    const members = await prisma.collectionMember.findMany({
      where: { collectionId },
      orderBy: { invitedAt: "desc" },
      select: {
        id: true,
        status: true,
        role: true,
        invitedAt: true,
        respondedAt: true,
        user: { select: { id: true, username: true, name: true, image: true } },
      },
    });
    return res.json({ members });
  }

  // DELETE — remove a member
  if (req.method === "DELETE") {
    const { userId: targetId } = req.body as { userId?: string };
    if (!targetId) return res.status(400).json({ error: "userId is required" });

    await prisma.collectionMember.deleteMany({
      where: { collectionId, userId: targetId },
    });
    return res.json({ ok: true });
  }

  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
