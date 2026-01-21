// pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]"; // adjust if needed
import { PrismaClient } from "@prisma/client";

// --- Prisma singleton (prevents multiple clients in dev) ---
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// --- Validation helpers ---
const USERNAME_RE = /^[a-zA-Z0-9._]{3,20}$/;

function normalizeUsername(raw: unknown): string | null | undefined {
  if (typeof raw !== "string") return undefined; // don't touch if not provided
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // same sanitize as client `toHandle`
  const sanitized = trimmed
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 20);

  if (!USERNAME_RE.test(sanitized)) return "__invalid__"; // sentinel
  return sanitized;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      username: true,
      bio: true,
    },
  });
  if (!dbUser) return res.status(404).json({ error: "User not found" });

  if (req.method === "GET") {
    return res.json({ ok: true, user: dbUser });
  }

  if (req.method === "PATCH") {
    // Accept name/username/image/bio; ignore anything else
    const { name, username, image, bio } = (req.body ?? {}) as {
      name?: unknown;
      username?: unknown;
      image?: unknown;
      bio?: unknown;
    };

    // Basic type checks (cheap & cheerful)
    const nextName = typeof name === "string" ? name.trim() : undefined;
    const nextImage =
      typeof image === "string" || image === null
        ? (image as string | null)
        : undefined;
    const nextBio = typeof bio === "string" ? bio.slice(0, 280) : undefined;

    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername === "__invalid__") {
      return res.status(400).json({ error: "Invalid username format" });
    }

    // Uniqueness check if username provided (string or null)
    if (typeof normalizedUsername !== "undefined") {
      if (normalizedUsername) {
        const existing = await prisma.user.findFirst({
          where: { username: normalizedUsername, NOT: { id: dbUser.id } },
          select: { id: true },
        });
        if (existing)
          return res.status(409).json({ error: "Username is already taken" });
      }
    }

    try {
      const updated = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: nextName,
          // If undefined -> leave as is; if null -> set null; if string -> set string
          username:
            typeof normalizedUsername === "undefined"
              ? undefined
              : normalizedUsername,
          image: nextImage,
          bio: nextBio,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          username: true,
          bio: true,
        },
      });

      return res.json({ ok: true, user: updated });
    } catch (e: unknown) {
      if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
        // unique constraint (username/email)
        return res.status(409).json({ error: "Username is already taken" });
      }
      console.error(e);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }

  res.setHeader("Allow", "GET,PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
