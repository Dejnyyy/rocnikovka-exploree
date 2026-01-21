// /pages/api/profile/username.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; // adjust path if needed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// same sanitizer as client
const USERNAME_RE = /^[a-zA-Z0-9._]{3,20}$/;
function toHandle(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 20);
}

// reserve some paths/words
const RESERVED = new Set([
  "admin",
  "root",
  "support",
  "help",
  "settings",
  "login",
  "logout",
  "signup",
  "register",
  "api",
  "about",
  "contact",
  "terms",
  "privacy",
  "explore",
  "discover",
  "u",
  "user",
  "users",
  "me",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") return getAvail(req, res);
  if (req.method === "POST") return setUsername(req, res);
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}

async function getAvail(req: NextApiRequest, res: NextApiResponse) {
  const raw = String(req.query.username ?? "");
  const username = raw.toLowerCase();

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(200).json({ available: false, reason: "invalid" });
  }
  if (RESERVED.has(username)) {
    return res.status(200).json({ available: false, reason: "reserved" });
  }

  const exists = await prisma.user.findFirst({
    where: { username },
    select: { id: true },
  });

  return res.status(200).json({ available: !exists });
}

async function setUsername(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const raw = String(body?.username ?? "");
  const username = raw.toLowerCase();

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Invalid username" });
  }
  if (RESERVED.has(username)) {
    return res.status(400).json({ error: "Username is reserved" });
  }

  // Is someone else using it?
  const clash = await prisma.user.findFirst({
    where: { username },
    select: { id: true },
  });
  if (clash) {
    return res.status(409).json({ error: "Username already taken" });
  }

  // Update current user (by email; adjust if you store user id in session)
  await prisma.user.update({
    where: { email: session.user.email },
    data: { username },
  });

  return res.status(200).json({ ok: true, username });
}
