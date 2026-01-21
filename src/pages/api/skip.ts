import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  // const { spotId } = JSON.parse(req.body);
  // TODO: maybe record skip or do nothing
  return res.status(200).json({ ok: true });
}
