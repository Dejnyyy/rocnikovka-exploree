import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { spotId } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!spotId || typeof spotId !== "string") {
      return res.status(400).json({ error: "spotId is required" });
    }

    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: { id: true },
    });

    if (!spot) {
      return res.status(404).json({ error: "Spot not found" });
    }

    await prisma.skip.upsert({
      where: {
        userId_spotId: {
          userId,
          spotId,
        },
      },
      create: {
        userId,
        spotId,
      },
      update: {},
    });

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    console.error("Skip error:", e);
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: "Failed to skip spot" });
  }
}
