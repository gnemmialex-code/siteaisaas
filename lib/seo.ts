import type { Metadata } from "next";

/**
 * URL canonique du site. Une seule version du domaine doit répondre en 200 :
 * astracrea.co et http:// redirigent (308 permanent) vers https://www.astracrea.co.
 */
export const SITE_URL = "https://www.astracrea.co";
export const SITE_NAME = "AstraCrea";

/**
 * Title (57 caractères) et description (156 caractères) de la page d'accueil.
 * Partagés entre le layout racine (valeur de repli du site) et app/page.tsx.
 * Le slogan « Fake It Until You Make It » reste dans le visuel du hero :
 * il n'apporte aucun signal de recherche dans un title.
 */
export const HOME_TITLE = "Essayage virtuel de montres de luxe par IA 4K — AstraCrea";
export const HOME_DESCRIPTION =
  "Ajoutez les montres de luxe les plus rares à votre poignet : envoyez une photo, notre IA génère un rendu 4K réaliste en moins de 30 secondes. Essai gratuit.";

interface PageSeoOptions {
  /** Chemin de la page, commençant par « / » (ex. "/pricing"). */
  path: string;
  title: string;
  description: string;
  /** Espace applicatif privé ou page technique : hors index. */
  noIndex?: boolean;
}

/**
 * Construit la metadata d'une page publique : canonical + Open Graph + Twitter
 * cohérents, sans avoir à répéter siteName / locale / type sur chaque route.
 *
 * L'image OG (1200×630) n'est pas déclarée ici : Next l'injecte automatiquement
 * depuis app/opengraph-image.tsx, pour og:image comme pour twitter:image.
 */
export function pageMetadata({ path, title, description, noIndex }: PageSeoOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
