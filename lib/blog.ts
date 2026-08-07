import fs from "node:fs";
import path from "node:path";

/**
 * Couche de lecture des articles.
 *
 * Un article = un fichier content/blog/<slug>.mdx qui exporte `meta`.
 * Poser un fichier suffit : il apparaît dans la liste, dans le sitemap et
 * reçoit son JSON-LD, sans rien enregistrer ailleurs.
 *
 * `draft: true` (valeur par défaut si le champ est absent) garde l'article
 * hors de la liste et du sitemap, et le passe en noindex. L'URL reste
 * consultable pour relecture. Rien ne se publie sans que quelqu'un ait
 * basculé ce drapeau à la main — c'est volontaire.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  title: string;
  description: string;
  /** Date ISO (AAAA-MM-JJ) de première publication. */
  publishedAt: string;
  /** Date ISO de dernière révision de fond. Facultative. */
  updatedAt?: string;
  author?: string;
  tags?: string[];
  /** Image de couverture, chemin absolu depuis /public. */
  image?: string;
  /** Tant que ce drapeau est vrai, l'article n'est ni listé ni indexé. */
  draft?: boolean;
}

export interface Post extends PostMeta {
  slug: string;
}

/** Slugs de tous les fichiers présents, brouillons compris. */
export function allSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/**
 * Charge un article. Retourne null si le fichier n'existe pas — le gabarit
 * s'en sert pour renvoyer un 404 propre.
 */
export async function getPost(
  slug: string,
): Promise<{ meta: Post; Content: React.ComponentType } | null> {
  if (!allSlugs().includes(slug)) return null;

  const mod = await import(`@/content/blog/${slug}.mdx`);
  const meta = mod.meta as PostMeta | undefined;

  if (!meta?.title || !meta?.description || !meta?.publishedAt) {
    throw new Error(
      `content/blog/${slug}.mdx : l'export \`meta\` doit contenir au minimum title, description et publishedAt.`,
    );
  }

  return {
    meta: { ...meta, draft: meta.draft ?? true, slug },
    Content: mod.default,
  };
}

/** Articles publiés, du plus récent au plus ancien. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await Promise.all(allSlugs().map((slug) => getPost(slug)));

  return posts
    .flatMap((p) => (p && !p.meta.draft ? [p.meta] : []))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Date lisible en français, pour l'affichage. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
