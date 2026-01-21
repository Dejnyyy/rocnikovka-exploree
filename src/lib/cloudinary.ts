// /src/lib/cloudinary.ts
import { v2 as cld } from "cloudinary";

// Prevent leaking secrets by importing this on the client
if (typeof window !== "undefined") {
  throw new Error("Do not import /src/lib/cloudinary.ts on the client.");
}

// Try to parse CLOUDINARY_URL if provided
function parseCloudinaryUrl(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      cloud_name: u.hostname,
      api_key: u.username,
      api_secret: u.password,
    };
  } catch {
    return null;
  }
}

const fromUrl =
  parseCloudinaryUrl(process.env.CLOUDINARY_URL) ??
  // LAST RESORT only; avoid exposing this in production
  parseCloudinaryUrl(process.env.NEXT_PUBLIC_CLOUDINARY_URL);

const cloud_name =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  fromUrl?.cloud_name;

const api_key = process.env.CLOUDINARY_API_KEY || fromUrl?.api_key;
const api_secret = process.env.CLOUDINARY_API_SECRET || fromUrl?.api_secret;

if (!cloud_name || !api_key || !api_secret) {
  throw new Error(
    "Missing Cloudinary server config. Provide either CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET. Avoid NEXT_PUBLIC_* for secrets."
  );
}

cld.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true,
});

// ===== Types & helpers =====
type CloudinarySearchResource = {
  public_id: string;
  width: number;
  height: number;
  created_at: string;
  tags?: string[];
  context?: { custom?: Record<string, string> };
};

export type Place = {
  id: string;
  title: string;
  coverUrl: string;
  city?: string;
  country?: string;
  width?: number;
  height?: number;
  createdAt?: string;
  tags?: string[];
};

export function coverUrl(publicId: string, w = 1200, h = 800) {
  return cld.url(publicId, {
    transformation: [
      { width: w, height: h, crop: "fill", gravity: "auto" },
      { fetch_format: "auto", quality: "auto" },
    ],
    secure: true,
  });
}

export function toPlace(r: CloudinarySearchResource): Place {
  const custom = r.context?.custom ?? {};
  const title =
    custom.title ||
    (r.public_id?.split("/").pop() ?? "").replace(/[-_]/g, " ") ||
    "Untitled";

  return {
    id: r.public_id,
    title,
    coverUrl: coverUrl(r.public_id),
    city: custom.city,
    country: custom.country,
    width: r.width,
    height: r.height,
    createdAt: r.created_at,
    tags: r.tags,
  };
}

export default cld;
