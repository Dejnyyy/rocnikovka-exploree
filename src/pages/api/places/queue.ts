import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PrismaClient, Prisma } from "@prisma/client";
import { coverUrl as cldCoverUrl } from "@/lib/cloudinary";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email)
    return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(
    parseInt(String(req.query.limit ?? "20"), 10) || 20,
    50
  );
  const cursorStr =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const cursorDate = cursorStr ? new Date(cursorStr) : undefined;

  const where: Prisma.SpotWhereInput = {
    authorId: { not: user.id },
    ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    // exclude already saved/liked by this user
    saves: { none: { userId: user.id } },
    likes: { none: { userId: user.id } },
  };

  const spots = await prisma.spot.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      image: true,
      coverUrl: true,
      createdAt: true,
    },
  });

  const hasMore = spots.length > limit;
  const slice = hasMore ? spots.slice(0, -1) : spots;

  const items = slice.map((s) => {
    const fromCloudinary =
      s.image && !/^https?:\/\//i.test(s.image)
        ? cldCoverUrl(s.image, 1200, 800)
        : null;
    const coverUrl = fromCloudinary || s.coverUrl || s.image;

    return {
      id: s.id,
      title: s.title,
      coverUrl,
      city: s.city ?? undefined,
      country: s.country ?? undefined,
      createdAt: s.createdAt.toISOString(),
    };
  });

  const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

  return res.json({ items, nextCursor });
}
