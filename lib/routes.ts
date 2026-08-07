/**
 * Découpage des routes entre ce qui est public et ce qui ne doit ni être
 * exploré ni indexé.
 *
 * Source unique partagée par app/robots.ts et app/sitemap.ts : les deux ne
 * peuvent pas diverger, et une page ajoutée plus tard sera automatiquement
 * traitée (le sitemap lit les routes réelles sur le disque et applique ces
 * mêmes règles).
 */

/**
 * Préfixes exclus de l'exploration et du sitemap : espace applicatif,
 * authentification, back-office, API et pages techniques.
 */
export const PRIVATE_PREFIXES = [
  "/api",
  "/auth",
  "/admin",
  "/dashboard",
  "/result",
  "/snap-rouge",
  "/upload",
  "/login",
  "/preview-mobile",
] as const;

export function isPrivateRoute(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Réglages de sitemap par route. Une route publique absente de cette table
 * reçoit les valeurs par défaut plus bas — elle n'est jamais oubliée.
 */
const SITEMAP_SETTINGS: Record<
  string,
  { changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }
> = {
  "/": { changeFrequency: "weekly", priority: 1 },
  "/pricing": { changeFrequency: "monthly", priority: 0.9 },
  "/register": { changeFrequency: "monthly", priority: 0.7 },
  "/contact": { changeFrequency: "yearly", priority: 0.5 },
  "/terms": { changeFrequency: "yearly", priority: 0.3 },
  "/privacy": { changeFrequency: "yearly", priority: 0.3 },
  "/consent": { changeFrequency: "yearly", priority: 0.3 },
};

export function sitemapSettings(path: string) {
  return SITEMAP_SETTINGS[path] ?? { changeFrequency: "monthly" as const, priority: 0.5 };
}
