import type { MetadataRoute } from "next";
import { PRIVATE_PREFIXES } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt.
 *
 * Les crawlers des moteurs de réponse IA sont autorisés explicitement. Ce
 * n'est pas redondant avec la règle « * » : plusieurs de ces agents ne lisent
 * que le groupe qui les nomme, et un groupe nominatif lève toute ambiguïté.
 *
 * Vérifié côté production avant écriture : rien ne les bloquait en amont
 * (Vercel sert le site en direct, sans Cloudflare ni pare-feu applicatif, et
 * proxy.ts ne filtre aucun user-agent) — les onze agents testés répondaient
 * déjà en 200.
 *
 * Google-Extended et Applebot-Extended ne sont pas des robots d'exploration :
 * ce sont les jetons par lesquels Google et Apple lisent l'autorisation
 * d'utiliser le contenu pour leurs modèles et leurs réponses génératives.
 * Les autoriser est un choix d'exposition, pas un réglage technique.
 */
const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

/**
 * Préfixes SANS slash final, volontairement.
 *
 * Une règle « Disallow: /login/ » ne s'applique qu'aux chemins commençant par
 * « /login/ » : l'URL réelle « /login » y échapperait entièrement. La forme
 * sans slash couvre la page elle-même et tout son sous-arbre.
 *
 * Contrepartie assumée : elle bloquerait aussi une future URL publique qui
 * commencerait par ces mêmes lettres (« /dashboard-guide » par exemple). À
 * garder en tête si des pages de contenu sont ajoutées en Phase 5.
 */
const DISALLOW = [...PRIVATE_PREFIXES];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: AI_USER_AGENTS,
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
