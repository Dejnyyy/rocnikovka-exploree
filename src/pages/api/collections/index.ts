// pages/api/collections/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
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
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    const { name, spotId } = (req.body ?? {}) as {
      name?: string;
      spotId?: string;
    };
    const trimmed = (name ?? "").trim();
    if (!trimmed) return res.status(400).json({ error: "Missing name" });

    const slug = trimmed
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // upsert collection by (userId, name) — your schema has @@unique([userId, name])
        const col = await tx.collection.upsert({
          where: { userId_name: { userId, name: trimmed } },
          update: {},
          create: { userId, name: trimmed, slug },
          select: { id: true, name: true },
        });

        if (spotId) {
          await tx.collectionSpot.upsert({
            where: { collectionId_spotId: { collectionId: col.id, spotId } },
            update: {},
            create: { collectionId: col.id, spotId },
          });
        }

        // count for UI
        const count = await tx.collectionSpot.count({
          where: { collectionId: col.id },
        });

        return { id: col.id, name: col.name, count, saved: !!spotId };
      });

      return res.json(result);
    } catch (e: unknown) {
      // handle slug/unique edge cases gracefully
      if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
        return res.status(409).json({ error: "Name already used" });
      }
      console.error(e);
      return res.status(500).json({ error: "Failed to create/save" });
    }
  }

  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
}
