// pages/api/comments.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";

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

  return res.status(405).json({ error: "Method not allowed" });
}
