// /pages/api/foursquare/search.ts
import type { NextApiRequest, NextApiResponse } from "next";

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY?.trim();
const FOURSQUARE_CLIENT_ID = process.env.FOURSQUARE_CLIENT_ID?.trim();
const FOURSQUARE_SECRET = process.env.FOURSQUARE_SECRET?.trim();

type FoursquarePlace = {
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
};

type FoursquareSearchResponse = {
  results: FoursquarePlace[];
  context: {
    geo_bounds?: {
      circle?: {
        center: {
          latitude: number;
          longitude: number;
        };
        radius: number;
      };
    };
  };
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

  const { query, lat, lng, near, limit = "10" } = req.query;

  if ((!query && !lat) || (!query && !lng)) {
    return res.status(400).json({
      error: "Either 'query' or both 'lat' and 'lng' are required",
    });
  }

  try {
    let response;
    let lastError;
    let useLegacyAPI = false;

    // Try Places API v3 first if we have API key
    if (hasV3Credentials) {
      const params = new URLSearchParams();
      if (query) params.set("query", query as string);
      if (lat && lng) {
        params.set("ll", `${lat},${lng}`);
      }
      if (near) params.set("near", near as string);
      params.set("limit", limit as string);
      params.set(
        "fields",
        "fsq_id,name,location,geocodes,categories,rating,photos,description,hours,price,tel,website",
      );

      const apiUrl = `https://api.foursquare.com/v3/places/search?${params.toString()}`;

      const authFormats = [
        `fsq3 ${FOURSQUARE_API_KEY}`, // Official format for Places API v3
        `Bearer ${FOURSQUARE_API_KEY}`, // Alternative format
        FOURSQUARE_API_KEY, // Direct key
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
            break; // Success, exit loop
          } else {
            const errorText = await response.text();
            lastError = { status: response.status, text: errorText };
            if (response.status !== 401) {
              // If it's not auth error, stop trying
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
      console.log("Falling back to Legacy API v2...");
      useLegacyAPI = true;

      const params = new URLSearchParams();
      params.set("client_id", FOURSQUARE_CLIENT_ID!);
      params.set("client_secret", FOURSQUARE_SECRET!);
      params.set("v", "20211225"); // API version date
      params.set("limit", limit as string);

      if (query) {
        params.set("query", query as string);
      }
      // Legacy API v2 requires either 'll' or 'near' for most queries
      // But we can try global search with intent=global
      if (lat && lng) {
        params.set("ll", `${lat},${lng}`);
      } else if (near) {
        params.set("near", near as string);
      } else if (query) {
        // Try global search - Foursquare v2 supports intent=global for worldwide results
        params.set("intent", "global");
      }

      const apiUrl = `https://api.foursquare.com/v2/venues/search?${params.toString()}`;

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

      // If 401, API credentials are invalid
      if (lastError?.status === 401) {
        return res.status(503).json({
          error: "Foursquare API authentication failed",
          available: false,
          message:
            "Place search is temporarily unavailable. Please check your Foursquare credentials in .env file. You can still create places manually.",
        });
      }

      return res.status(lastError?.status || 500).json({
        error: "Foursquare API request failed",
        details: errorText,
        available: false,
      });
    }

    let data: any = await response.json();

    // Transform Legacy API v2 response to v3 format if needed
    if (useLegacyAPI && data.response && data.response.venues) {
      // Legacy API v2 format: { response: { venues: [...] } }
      const legacyVenues = data.response.venues;
      data = {
        results: legacyVenues.map((venue: any) => ({
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
        })),
      };
    }

    const typedData: FoursquareSearchResponse = data;

    // Transform Foursquare response to our format
    const results = typedData.results.map((place) => ({
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
    }));

    return res.status(200).json({ results });
  } catch (error: unknown) {
    console.error("Foursquare search error:", error);
    return res.status(500).json({
      error: "Failed to search places",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
