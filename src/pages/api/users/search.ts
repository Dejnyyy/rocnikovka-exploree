// pages/api/users/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as Session | null;
  const userId = (session?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const q = ((req.query.q as string) ?? "").replace(/^@/, "").trim();
  if (!q || q.length < 2) return res.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [{ username: { contains: q } }, { name: { contains: q } }],
    },
    take: 6,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
    },
  });

  return res.json({ users });
}
