import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { EXAMPLE_IMAGE_PATHS } from "@/lib/examples";
import { getPublishedLandingPages, landingPath } from "@/lib/landing";
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

/**
 * Images de contenu déclarées par page (extension sitemap images de Google).
 *
 * Seules les images qui sont du vrai contenu y figurent. Le fond du hero en est
 * absent volontairement : ses tuiles sont décoratives, posées sous plusieurs
 * voiles et marquées aria-hidden — les déclarer reviendrait à pousser vers
 * Google Images des visuels que la page elle-même ne présente pas comme du
 * contenu. Les logos et les aperçus d'upload en sont absents pour la même
 * raison.
 */
const IMAGES_BY_ROUTE: Record<string, string[]> = {
  "/": EXAMPLE_IMAGE_PATHS,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Routes statiques réellement présentes dans app/
  const staticRoutes: MetadataRoute.Sitemap = collectRoutes()
    .filter(({ route }) => !isPrivateRoute(route))
    .sort((a, b) => a.route.localeCompare(b.route))
    .map(({ route, file }) => {
      const { changeFrequency, priority } = sitemapSettings(route);
      const images = IMAGES_BY_ROUTE[route];
      return {
        url: new URL(route, SITE_URL).toString(),
        lastModified: lastModified(file),
        changeFrequency,
        priority,
        ...(images ? { images: images.map((p) => new URL(p, SITE_URL).toString()) } : {}),
      };
    });

  // 2. Articles publiés. collectRoutes() ignore les segments dynamiques, les
  //    URL d'articles sont donc ajoutées ici. Les brouillons sont exclus par
  //    getPublishedPosts().
  const posts: MetadataRoute.Sitemap = (await getPublishedPosts()).map((post) => ({
    url: new URL(`/blog/${post.slug}`, SITE_URL).toString(),
    lastModified: new Date(`${post.updatedAt ?? post.publishedAt}T12:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // 3. Pages d'atterrissage dont le contenu a été écrit et validé.
  const landings: MetadataRoute.Sitemap = getPublishedLandingPages().map((page) => ({
    url: new URL(landingPath(page), SITE_URL).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...posts, ...landings];
}
