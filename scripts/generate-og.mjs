// Script to generate the OG image with Quicksand font
// Usage: node --experimental-vm-modules scripts/generate-og.mjs

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load the logo
const logoPng = readFileSync(join(root, "public", "logos", "exploree.png"));
const logoBase64 = `data:image/png;base64,${logoPng.toString("base64")}`;

// Load Quicksand Bold font (TTF — satori doesn't support woff2)
console.log("Loading Quicksand Bold font...");
const quicksandBold = readFileSync(join(root, "public", "fonts", "Quicksand-Bold.ttf"));

console.log("Generating SVG with Satori...");
const svg = await satori(
  {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "Quicksand",
        background: "#1a1025",
        overflow: "hidden",
      },
      children: [
        // Content wrapper
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              position: "relative",
            },
            children: [
              // Logo
              {
                type: "img",
                props: {
                  src: logoBase64,
                  width: 140,
                  height: 140,
                },
              },
              // Brand name
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "76px",
                    fontWeight: 700,
                    color: "white",
                    lineHeight: 1,
                    letterSpacing: "-1px",
                    marginTop: "8px",
                  },
                  children: "Exploree",
                },
              },
              // Accent line
              {
                type: "div",
                props: {
                  style: {
                    width: "80px",
                    height: "3px",
                    borderRadius: "2px",
                    background: "linear-gradient(90deg, #f472b6, #fbbf24)",
                    marginTop: "4px",
                  },
                },
              },
              // Tagline
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "28px",
                    fontWeight: 700,
                    background: "linear-gradient(90deg, #f472b6, #fb923c)",
                    backgroundClip: "text",
                    color: "transparent",
                    letterSpacing: "0.5px",
                    marginTop: "4px",
                  },
                  children: "Discover places worth the trip",
                },
              },
            ],
          },
        },
        // URL at bottom
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "32px",
              fontSize: "16px",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.35)",
              letterSpacing: "1px",
            },
            children: "exploree.dejny.eu",
          },
        },
      ],
    },
  },
  {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Quicksand",
        data: Buffer.from(quicksandBold),
        weight: 700,
        style: "normal",
      },
    ],
  }
);

console.log("Converting SVG to PNG...");
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
});
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

const outPath = join(root, "public", "og-image.png");
writeFileSync(outPath, pngBuffer);
console.log(`✅ OG image saved to ${outPath} (${pngBuffer.length} bytes)`);
