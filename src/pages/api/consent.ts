import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CONSENT_VERSION } from "@/lib/consent";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { consentedAt: true, consentVersion: true },
    });
    return res.status(200).json({
      consentedAt: user?.consentedAt ?? null,
      consentVersion: user?.consentVersion ?? null,
      currentVersion: CONSENT_VERSION,
    });
  }

  if (req.method === "POST") {
    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { consentedAt: new Date(), consentVersion: CONSENT_VERSION },
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
