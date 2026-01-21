// /pages/api/places/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD") // strip accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60); // keep it tidy
}

async function uniqueSlug(base: string) {
  let slug = base || "spot";
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.spot.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  // we prefer id from session, else fetch by email
  let authorId = (session.user as any)?.id as string | undefined;
  if (!authorId && session.user.email) {
    const u = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    authorId = u?.id;
  }
  if (!authorId) return res.status(401).json({ error: "Unauthorized" });

  const {
    title,
    description,
    city,
    country,
    tags = [],
    lat,
    lng,
    imagePublicId,
    imageUrl, // secure_url fallback
  } = (req.body ?? {}) as {
    title: string;
    description?: string;
    city?: string;
    country?: string;
    tags?: string[];
    lat?: number | string;
    lng?: number | string;
    imagePublicId: string;
    imageUrl: string;
  };

  if (!title) return res.status(400).json({ error: "Title is required" });
  const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
  const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }
  if (latNum! < -90 || latNum! > 90 || lngNum! < -180 || lngNum! > 180) {
    return res.status(400).json({ error: "Latitude/Longitude out of bounds" });
  }

  // 'image' is REQUIRED in your schema; prefer Cloudinary public_id, else use URL
  const image = imagePublicId || imageUrl;
  if (!image) return res.status(400).json({ error: "Image is required" });

  try {
    const base = toSlug(title);
    const slug = await uniqueSlug(base);

    const created = await prisma.spot.create({
      data: {
        title,
        slug,
        description: description?.trim() || null,
        lat: latNum!,
        lng: lngNum!,
        city: city?.trim() || null,
        country: country?.trim() || null,
        // store original URL as coverUrl if you have it (handy for clients)
        coverUrl: imageUrl || null,
        image, // Cloudinary public_id preferred; falls back to url
        tags: Array.isArray(tags)
          ? (tags as unknown as Prisma.JsonArray)
          : ([] as unknown as Prisma.JsonArray),
        authorId,
      },
      select: { id: true, slug: true },
    });

    return res.status(201).json({ ok: true, spot: created });
  } catch (e: unknown) {
    console.error(e);
    // Duplicate slug safety (rare because we ensure uniqueness, but just in case)
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return res.status(409).json({
        error:
          "A spot with similar slug already exists. Try a different title.",
      });
    }
    return res.status(500).json({ error: "Failed to create spot" });
  }
}
