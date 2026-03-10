import type { NextApiRequest, NextApiResponse } from "next";

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY?.trim();
const FOURSQUARE_CLIENT_ID = process.env.FOURSQUARE_CLIENT_ID?.trim();
const FOURSQUARE_SECRET = process.env.FOURSQUARE_SECRET?.trim();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      error: "Both 'lat' and 'lng' are required",
    });
  }

  const hasV3Credentials = !!FOURSQUARE_API_KEY;

  if (!hasV3Credentials) {
    return res.status(503).json({
      error: "Foursquare API credentials not configured",
      available: false,
    });
  }

  try {
    const params = new URLSearchParams();
    params.set("ll", `${lat},${lng}`);
    params.set("limit", "1"); // We only need the top result for context
    params.set("fields", "location");

    const apiUrl = `https://api.foursquare.com/v3/places/search?${params.toString()}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: FOURSQUARE_API_KEY as string,
      "X-Places-Api-Version": "20231010",
    };

    if (req.headers["accept-language"]) {
      headers["Accept-Language"] = req.headers["accept-language"];
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Foursquare API request failed",
      });
    }

    const data: any = await response.json();
    const firstResult = data.results?.[0];

    if (!firstResult) {
      return res.status(404).json({ error: "No location data found" });
    }

    return res.status(200).json({
      city: firstResult.location.locality || "",
      country: firstResult.location.country || "",
      region: firstResult.location.region || "",
    });
  } catch (error: unknown) {
    console.error("Foursquare reverse geocode error:", error);
    return res.status(500).json({
      error: "Failed to reverse geocode",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
