import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

/**
 * Metadata de /consent. Le contenu de la page légale n'est pas modifié :
 * ce layout ne fait qu'ajouter le canonical et l'Open Graph autour d'elle.
 */
export const metadata: Metadata = pageMetadata({
  path: "/consent",
  title: "Politique de Consentement — AstraCrea",
  description:
    "Politique de consentement d'AstraCrea : traitement des données biométriques, usage des photos envoyées et droits des utilisateurs.",
});

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema({ name: "Politique de Consentement", path: "/consent" })} />
      {children}
    </>
  );
}
