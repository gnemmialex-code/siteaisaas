import type { Metadata } from "next";
import HomeContent from "./home-content";
import JsonLd from "./components/JsonLd";
import { HOME_FAQ } from "@/lib/faq";
import { faqPageSchema, softwareApplicationSchema } from "@/lib/schema";
import { HOME_DESCRIPTION, HOME_TITLE, pageMetadata } from "@/lib/seo";

/**
 * Enveloppe serveur de la page d'accueil.
 *
 * Tout le rendu visuel vit dans home-content.tsx, qui reste un composant client
 * ("use client") : le design est inchangé. Ce fichier existe uniquement parce
 * qu'un composant client ne peut pas exporter `metadata` — c'est ici que
 * s'ancrent le title, la description, le canonical, l'Open Graph et les
 * données structurées de « / ».
 */
export const metadata: Metadata = pageMetadata({
  path: "/",
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
});

export default function HomePage() {
  return (
    <>
      {/* HOME_FAQ alimente aussi l'accordéon visible : le balisage FAQPage ne
          peut pas diverger du texte affiché. */}
      <JsonLd data={[softwareApplicationSchema(), faqPageSchema(HOME_FAQ, "/")]} />
      <HomeContent />
    </>
  );
}
