// pages/api/comments.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { canDeleteComment } from "@/lib/comments";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ---------- GET  /api/comments?spotId=xxx ----------
  if (req.method === "GET") {
    const spotId = req.query.spotId as string | undefined;
    if (!spotId) {
      return res.status(400).json({ error: "spotId is required" });
    }

    const comments = await prisma.comment.findMany({
      where: { spotId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return res.status(200).json({ comments });
  }

  // ---------- POST  /api/comments ----------
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { spotId, text } = req.body as {
      spotId?: string;
      text?: string;
    };

    if (!spotId || !text || text.trim().length === 0) {
      return res.status(400).json({ error: "spotId and text are required" });
    }
    if (text.length > 500) {
      return res
        .status(400)
        .json({ error: "Comment must be 500 characters or less" });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId: session.user.id as string,
        spotId,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return res.status(201).json({ comment });
  }

  // ---------- DELETE  /api/comments ----------
  if (req.method === "DELETE") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { commentId } = req.body as { commentId?: string };
    if (!commentId) {
      return res.status(400).json({ error: "commentId is required" });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        userId: true,
        spot: { select: { authorId: true } },
      },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const allowed = canDeleteComment({
      viewerId: session.user.id as string,
      commentAuthorId: comment.userId,
      spotAuthorId: comment.spot.authorId,
    });
    if (!allowed) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
