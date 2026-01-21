// pages/api/collections/create.ts (příklad)
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

function toSlug(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const userId = req.body.userId; // vezmi z session
  const name = (req.body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Name required" });

  let slug = toSlug(name);
  // případné dopočítání suffixu při kolizi
  let i = 2;
  // pokusně hledáme existenci stejně u usera
  while (await prisma.collection.findFirst({ where: { userId, slug } })) {
    slug = `${toSlug(name)}-${i++}`;
  }

  try {
    const col = await prisma.collection.create({
      data: { userId, name, slug, isPublic: true },
      select: { id: true, slug: true, name: true },
    });
    res.json(col);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Collection with this name/slug already exists." });
    }
    throw e;
  }
}
