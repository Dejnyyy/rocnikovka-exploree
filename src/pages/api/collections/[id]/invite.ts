// pages/api/collections/[id]/invite.ts
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
  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ error: "username is required" });

  // Only owner can invite
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!col)
    return res.status(404).json({ error: "Collection not found or not owner" });

  // Resolve target user
  const target = await prisma.user.findFirst({
    where: { username },
    select: { id: true, username: true },
  });
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === userId)
    return res.status(400).json({ error: "Cannot invite yourself" });

  // Upsert membership (re-invite if previously declined)
  const member = await prisma.collectionMember.upsert({
    where: { collectionId_userId: { collectionId, userId: target.id } },
    update: { status: "pending", respondedAt: null },
    create: {
      collectionId,
      userId: target.id,
      role: "editor",
      status: "pending",
    },
  });

  return res.json({
    ok: true,
    member: { id: member.id, username: target.username, status: member.status },
  });
}
