import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { excludeId } = req.query;

    // Fetch all spots except the current one
    const places = await prisma.spot.findMany({
      where: { id: { not: excludeId as string } }, // Exclude the current place
    });

    // If no more places are available, return an error
    if (places.length === 0) {
      return res.status(404).json({ error: "No more places available" });
    }

    // Pick a random place from the available ones
    const randomPlace = places[Math.floor(Math.random() * places.length)];

    return res.status(200).json(randomPlace);
  } catch (error) {
    console.error("Error fetching random place:", error);
    return res.status(500).json({ error: "Failed to fetch a new place" });
  }
}
