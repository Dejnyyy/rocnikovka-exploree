// pages/api/spot.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma"; // adjust import if your prisma path differs
import { Prisma } from "@prisma/client";
import { z } from "zod";

const SpotCreateSchema = z.object({
  title: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  image: z.string().min(1),
  authorId: z.string().min(1),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  slug: z.string().optional(),
  description: z.string().max(500).optional().nullable(),
  tags: z.array(z.any()).optional(),
});

function sendError(res: NextApiResponse, e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      // unique constraint failed
      return res
        .status(409)
        .json({ error: "Unique constraint failed", target: e.meta?.target });
    }
    return res.status(400).json({ error: `Prisma error ${e.code}` });
  }
  const isProd = process.env.NODE_ENV === "production";
  return res.status(500).json({
    error: "Internal Server Error",
    ...(isProd ? {} : { details: String(e) }),
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const parsed = SpotCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.flatten(),
        });
      }
      const {
        title,
        lat,
        lng,
        image,
        authorId,
        city,
        country,
        coverUrl,
        slug: providedSlug,
        description,
        tags,
      } = parsed.data;

      const slugify = (s: string) =>
        s
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      let slug =
        providedSlug &&
        typeof providedSlug === "string" &&
        providedSlug.length > 0
          ? slugify(providedSlug)
          : slugify(title);

      // ensure uniqueness
      const mkSuffix = () => Math.random().toString(36).slice(2, 8);
      for (let i = 0; i < 5; i++) {
        const exists = await prisma.spot.findUnique({ where: { slug } });
        if (!exists) break;
        slug = `${slug}-${mkSuffix()}`;
      }

      const newSpot = await prisma.spot.create({
        data: {
          title,
          slug,
          description: description ?? null,
          lat: Number(lat),
          lng: Number(lng),
          city: city ?? null,
          country: country ?? null,
          coverUrl: coverUrl ?? null,
          image, // required by schema
          tags: Array.isArray(tags) ? tags : undefined, // expects Json
          authorId,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          lat: true,
          lng: true,
          city: true,
          country: true,
          coverUrl: true,
          image: true,
          authorId: true,
          createdAt: true,
        },
      });

      return res.status(201).json(newSpot);
    } catch (e) {
      console.error(e);
      return sendError(res, e);
    }
  }

  if (req.method === "GET") {
    try {
      const spots = await prisma.spot.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          lat: true,
          lng: true,
          city: true,
          country: true,
          coverUrl: true,
          image: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, image: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ spots });
    } catch (e) {
      console.error(e);
      return sendError(res, e);
    }
    return;
  }

  return res.status(405).json({ error: "Method not allowed" });
}
