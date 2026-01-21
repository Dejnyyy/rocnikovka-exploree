import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google profile photos (NextAuth / Google)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      // Foursquare photos
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "fastly.4sqi.net" },
      { protocol: "https", hostname: "igx.4sqi.net" },
    ],
  },
  /* config options here */
  reactStrictMode: true,
};

export default nextConfig;
