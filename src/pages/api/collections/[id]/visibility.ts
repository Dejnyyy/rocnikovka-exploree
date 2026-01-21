import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: "Missing collection id" });

  // ✅ Body is already parsed by Next.js (for JSON)
  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body ?? {});
  const { isPublic } = body as { isPublic?: boolean };

  if (typeof isPublic !== "boolean") {
    return res.status(400).json({ error: "isPublic must be boolean" });
  }

  const col = await prisma.collection.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!col) return res.status(404).json({ error: "Not found" });
  if (col.userId !== session.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const updated = await prisma.collection.update({
    where: { id },
    data: { isPublic },
    select: { id: true, isPublic: true },
  });

  return res.status(200).json(updated);
}
