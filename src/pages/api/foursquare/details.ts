// /pages/api/foursquare/details.ts
import type { NextApiRequest, NextApiResponse } from "next";

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY?.trim();
const FOURSQUARE_CLIENT_ID = process.env.FOURSQUARE_CLIENT_ID?.trim();
const FOURSQUARE_SECRET = process.env.FOURSQUARE_SECRET?.trim();

type FoursquarePlaceDetails = {
  fsq_id: string;
  name: string;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
    formatted_address?: string;
  };
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  categories?: Array<{
    id: number;
    name: string;
  }>;
  rating?: number;
  photos?: Array<{
    id: string;
    created_at: string;
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  }>;
  description?: string;
  hours?: {
    display?: string;
  };
  price?: number;
  tel?: string;
  website?: string;
  tips?: Array<{
    text: string;
    created_at: string;
  }>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if we have any Foursquare credentials
  const hasV3Credentials = !!FOURSQUARE_API_KEY;
  const hasV2Credentials = !!FOURSQUARE_CLIENT_ID && !!FOURSQUARE_SECRET;

  if (!hasV3Credentials && !hasV2Credentials) {
    return res.status(503).json({
      error: "Foursquare API credentials not configured",
      available: false,
    });
  }

  const { fsq_id } = req.query;

  if (!fsq_id || typeof fsq_id !== "string") {
    return res.status(400).json({
      error: "fsq_id is required",
    });
  }

  try {
    let response;
    let lastError;
    let useLegacyAPI = false;

    // Try Places API v3 first if we have API key
    if (hasV3Credentials) {
      const params = new URLSearchParams();
      params.set(
        "fields",
        "fsq_id,name,location,geocodes,categories,rating,photos,description,hours,price,tel,website,tips",
      );

      const apiUrl = `https://api.foursquare.com/v3/places/${fsq_id}?${params.toString()}`;

      const authFormats = [
        `fsq3 ${FOURSQUARE_API_KEY}`,
        `Bearer ${FOURSQUARE_API_KEY}`,
        FOURSQUARE_API_KEY,
      ];

      for (const authFormat of authFormats) {
        try {
          response = await fetch(apiUrl, {
            headers: {
              Accept: "application/json",
              Authorization: authFormat,
              "X-Places-Api-Version": "1970-01-01",
            },
          });

          if (response.ok) {
            break;
          } else {
            const errorText = await response.text();
            lastError = { status: response.status, text: errorText };
            if (response.status !== 401) {
              break;
            }
          }
        } catch (error) {
          lastError = { status: 0, text: (error as Error).message };
          break;
        }
      }
    }

    // If v3 failed or we don't have v3 credentials, try Legacy API v2
    if ((!response || !response.ok) && hasV2Credentials) {
      console.log("Falling back to Legacy API v2 for details...");
      useLegacyAPI = true;

      const params = new URLSearchParams();
      params.set("client_id", FOURSQUARE_CLIENT_ID!);
      params.set("client_secret", FOURSQUARE_SECRET!);
      params.set("v", "20211225");

      const apiUrl = `https://api.foursquare.com/v2/venues/${fsq_id}?${params.toString()}`;

      try {
        response = await fetch(apiUrl, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = { status: response.status, text: errorText };
        }
      } catch (error) {
        lastError = { status: 0, text: (error as Error).message };
      }
    }

    if (!response || !response.ok) {
      const errorText = lastError?.text || "Unknown error";
      console.error("Foursquare API error:", errorText);
      return res.status(lastError?.status || 500).json({
        error: "Foursquare API request failed",
        details: errorText,
        available: false,
      });
    }

    let place: FoursquarePlaceDetails;

    if (useLegacyAPI) {
      // Transform Legacy API v2 response to v3 format
      const legacyData = await response.json();
      const venue = legacyData.response?.venue;
      if (!venue) {
        return res.status(404).json({
          error: "Place not found",
        });
      }

      place = {
        fsq_id: venue.id,
        name: venue.name,
        location: {
          address: venue.location.address || undefined,
          locality: venue.location.city || undefined,
          region: venue.location.state || undefined,
          postcode: venue.location.postalCode || undefined,
          country: venue.location.country || undefined,
          formatted_address: [
            venue.location.address,
            venue.location.city,
            venue.location.state,
            venue.location.country,
          ]
            .filter(Boolean)
            .join(", "),
        },
        geocodes: {
          main: {
            latitude: venue.location.lat,
            longitude: venue.location.lng,
          },
        },
        categories: venue.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
        })),
        rating: venue.rating,
        photos: venue.photos?.groups?.[0]?.items?.map((photo: any) => ({
          id: photo.id,
          created_at: photo.createdAt?.toString() || "",
          prefix: photo.prefix,
          suffix: photo.suffix,
          width: photo.width,
          height: photo.height,
        })),
        description: venue.description,
        hours: venue.hours ? { display: venue.hours.status } : undefined,
        price: venue.price?.tier,
        tel: venue.contact?.phone,
        website: venue.url,
        tips: venue.tips?.groups?.[0]?.items?.map((tip: any) => ({
          text: tip.text,
          created_at: tip.createdAt?.toString() || "",
        })),
      };
    } else {
      place = await response.json();
    }

    // Transform Foursquare response to our format
    const result = {
      fsq_id: place.fsq_id,
      name: place.name,
      address: place.location.formatted_address || place.location.address,
      city: place.location.locality,
      region: place.location.region,
      country: place.location.country,
      lat: place.geocodes.main.latitude,
      lng: place.geocodes.main.longitude,
      categories: place.categories?.map((c) => c.name) || [],
      primaryCategory: place.categories?.[0]?.name,
      rating: place.rating,
      photo: place.photos?.[0]
        ? `${place.photos[0].prefix}original${place.photos[0].suffix}`
        : null,
      description: place.description,
      hours: place.hours?.display,
      price: place.price,
      tel: place.tel,
      website: place.website,
      tips: place.tips?.map((t) => t.text) || [],
    };

    return res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Foursquare details error:", error);
    return res.status(500).json({
      error: "Failed to fetch place details",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
