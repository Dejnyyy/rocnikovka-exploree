// /pages/api/places/from-old-db.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import cld, {
  toPlace,
  coverUrl,
  type Place as CloudPlace,
} from "@/lib/cloudinary";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Robustní extrakce public_id z Cloudinary URL (zahodí transformace i příponu)
function publicIdFromCloudinaryUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      !/res\.cloudinary\.com/.test(u.hostname) ||
      !/\/image\/upload\//.test(u.pathname)
    )
      return null;
    const afterUpload = u.pathname.split("/upload/")[1] ?? "";
    // vynecháme transformační segmenty až po verzi vNNN...
    const segs = afterUpload.split("/");
    const vIdx = segs.findIndex((s) => /^v\d+$/.test(s));
    const rest = (vIdx >= 0 ? segs.slice(vIdx + 1) : segs).join("/");
    return rest.replace(/\.[^/.]+$/, ""); // drop extension
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const limit = Math.min(
      parseInt(one(req.query.limit) ?? "100", 10) || 100,
      500,
    );
    const verify = one(req.query.verify) === "1"; // volitelné ověření existence na Cloudinary (pomalejší)
    const debug = one(req.query.debug) === "1";

    // Vezmeme řádky z tabulky Place (musí existovat ve stejné DB)
    const rows = await prisma.$queryRawUnsafe<
      { id: string; name: string; image: string }[]
    >(
      `SELECT id, name, image FROM Place ORDER BY createdAt DESC LIMIT ${limit}`,
    );

    // Vybereme jen ty s cloudinary URL a vyrobíme náš unified tvar
    const candidates = rows
      .map((r) => {
        const pid = publicIdFromCloudinaryUrl(r.image);
        if (!pid) return null;
        return {
          publicId: pid,
          title: r.name,
          // coverUrl: sjednocený derivovaný URL s hezkou transformací
          coverUrl: coverUrl(pid, 1200, 800),
        };
      })
      .filter(Boolean) as {
      publicId: string;
      title: string;
      coverUrl: string;
    }[];

    let places: CloudPlace[] = [];
    if (verify) {
      // Ověříme na Cloudinary (zjistíme, které veřejné ID skutečně existují)
      // Cloudinary Search umí OR jen přes složený výraz; uděláme to po dávkách
      const chunkSize = 20;
      for (let i = 0; i < candidates.length; i += chunkSize) {
        const chunk = candidates.slice(i, i + chunkSize);
        const expr = [
          "resource_type:image",
          `(${chunk.map((c) => `public_id="${c.publicId}"`).join(" OR ")})`,
        ].join(" AND ");

        const data = await cld.search
          .expression(expr)
          .with_field("context")
          .with_field("tags")
          .max_results(chunk.length)
          .execute();

        const map = new Map<string, any>();
        (data.resources || []).forEach((r: any) => map.set(r.public_id, r));

        chunk.forEach((c) => {
          const r = map.get(c.publicId);
          if (r) {
            // Použijeme náš mapper
            const p = toPlace(r);
            // Přepíšeme title z původního DB name (pokud v Cloudinary není)
            if (
              !p.title ||
              p.title.toLowerCase() ===
                r.public_id.split("/").pop().replace(/[-_]/g, " ")
            ) {
              p.title = c.title;
            }
            places.push(p);
          }
        });
      }
    } else {
      // Bez verifikace rovnou sestavíme výstup – rychlé, předpokládá existenci
      places = candidates.map((c) => ({
        id: c.publicId,
        title: c.title,
        coverUrl: c.coverUrl,
        city: undefined,
        country: undefined,
      }));
    }

    if (debug) {
      console.log(
        `[from-old-db] -> rows=${rows.length}, cloudinaryCandidates=${candidates.length}, out=${places.length}`,
      );
    }

    res.status(200).json({ places });
  } catch (e: unknown) {
    console.error(
      "from-old-db error:",
      e instanceof Error ? e.message : String(e),
    );
    res.status(500).json({ error: "Failed to read old places" });
  }
}
