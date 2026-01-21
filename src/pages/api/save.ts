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

    // Check if spot exists
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: { id: true },
    });

    if (!spot) {
      return res.status(404).json({ error: "Spot not found" });
    }

    // Upsert save (create if doesn't exist, ignore if exists)
    await prisma.save.upsert({
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
      update: {}, // No update needed, just ensure it exists
    });

    console.log(`[save] User ${userId} saved spot ${spotId}`);

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    console.error("Save error:", e);
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      // Already saved, that's fine
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: "Failed to save spot" });
  }
}
