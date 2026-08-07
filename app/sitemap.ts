import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { isPrivateRoute, sitemapSettings } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

const APP_DIR = path.join(process.cwd(), "app");

/**
 * Parcourt app/ et renvoie les routes réellement définies par un page.tsx.
 *
 * Le sitemap est donc dérivé de l'arborescence, pas d'une liste tenue à la
 * main : une page ajoutée plus tard y entre d'office, et une page supprimée
 * en sort. Les segments dynamiques ([id]) et les groupes de routes sont
 * ignorés — le site n'en a pas de public aujourd'hui, et une URL à paramètre
 * ne peut pas être listée sans connaître ses valeurs.
 */
function collectRoutes(dir = APP_DIR, base = ""): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const name = entry.name;
      if (name.startsWith("_") || name.startsWith("[") || name.startsWith("(")) continue;
      out.push(...collectRoutes(path.join(dir, name), `${base}/${name}`));
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      out.push({ route: base === "" ? "/" : base, file: path.join(dir, entry.name) });
    }
  }

  return out;
}

/**
 * Date du dernier commit touchant le fichier. Vercel construit depuis un clone
 * git, donc l'information est disponible ; si elle ne l'est pas (clone
 * superficiel, build hors git), on retombe sur la date de build plutôt que
 * d'inventer une date.
 */
function lastModified(file: string): Date {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (iso) return new Date(iso);
  } catch {
    // git indisponible : on utilise la date de build
  }
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  return collectRoutes()
    .filter(({ route }) => !isPrivateRoute(route))
    .sort((a, b) => a.route.localeCompare(b.route))
    .map(({ route, file }) => {
      const { changeFrequency, priority } = sitemapSettings(route);
      return {
        url: new URL(route, SITE_URL).toString(),
        lastModified: lastModified(file),
        changeFrequency,
        priority,
      };
    });
}
