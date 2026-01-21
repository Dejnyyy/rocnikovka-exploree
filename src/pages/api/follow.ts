import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "DELETE")
    return res.status(405).json({ error: "Method not allowed" });

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const followerId = session?.user?.id;
  if (!followerId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId is required" });
    }

    if (followerId === userId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.method === "POST") {
      // Follow user
      try {
        await prisma.follow.create({
          data: {
            followerId,
            followingId: userId,
          },
        });
      } catch (e: unknown) {
        // Already following, that's fine
        if (!(e && typeof e === "object" && "code" in e && e.code === "P2002"))
          throw e;
      }

      return res.status(200).json({ ok: true, following: true });
    } else {
      // Unfollow user
      await prisma.follow.deleteMany({
        where: {
          followerId,
          followingId: userId,
        },
      });

      return res.status(200).json({ ok: true, following: false });
    }
  } catch (e: unknown) {
    console.error("Follow error:", e);
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      // Already following, that's fine
      return res.status(200).json({ ok: true, following: true });
    }
    return res.status(500).json({ error: "Failed to update follow status" });
  }
}
