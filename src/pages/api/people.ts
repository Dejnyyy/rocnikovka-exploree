// pages/api/people.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions).catch(
      () => null,
    );
    const currentUserId = (session?.user as { id: string } | undefined)?.id;

    const limit = Math.min(Number(req.query.limit) || 24, 60);
    const cursor = (req.query.cursor as string) || null;
    const q = ((req.query.q as string) || "").trim();

    const takePlusOne = limit + 1;

    // Build search conditions
    // MySQL is case-insensitive by default for most collations
    const where = q
      ? {
          OR: [
            // Search in name field
            { name: { contains: q } },
            // Search in username field
            { username: { contains: q } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            spots: true,
            collections: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: takePlusOne,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (users.length > limit) {
      const next = users.pop()!;
      nextCursor = next.id;
    }

    // Get follow status for current user (gracefully handle if Follow table doesn't exist yet)
    let followingIds: Set<string> = new Set();
    let followerIds: Set<string> = new Set();
    if (currentUserId) {
      try {
        const [following, followers] = await Promise.all([
          prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
          }),
          prisma.follow.findMany({
            where: { followingId: currentUserId },
            select: { followerId: true },
          }),
        ]);
        followingIds = new Set(following.map((f) => f.followingId));
        followerIds = new Set(followers.map((f) => f.followerId));
      } catch (followErr: unknown) {
        // If Follow table doesn't exist yet, just continue without follow status
        console.warn(
          "Could not fetch follow status:",
          followErr instanceof Error ? followErr.message : String(followErr),
        );
      }
    }

    res.json({
      items: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        image: u.image,
        bio: u.bio,
        spotsCount: u._count.spots,
        collectionsCount: u._count.collections,
        isFollowing: currentUserId ? followingIds.has(u.id) : false,
        isFollowedBy: currentUserId ? followerIds.has(u.id) : false,
        isOwnProfile: currentUserId === u.id,
      })),
      nextCursor,
    });
  } catch (err: unknown) {
    console.error("People API error:", err);
    // Check if it's a database connection error
    const errObj =
      err && typeof err === "object"
        ? (err as { message?: string; code?: string })
        : null;
    if (
      errObj?.message?.includes("Can't reach database server") ||
      errObj?.code === "P1001"
    ) {
      return res.status(503).json({
        error: "Database server unavailable",
        message: "Please check your database connection",
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
