import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { PRICING_FAQ } from "@/lib/faq";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

/**
 * Porte la metadata de /pricing : la page elle-même est un composant client
 * (« use client ») et ne peut donc pas exporter `metadata`.
 */
export const metadata: Metadata = pageMetadata({
  path: "/pricing",
  title: "Tarifs des abonnements IA — Essentiel, Pro, Elite — AstraCrea",
  description:
    "Comparez les abonnements AstraCrea : qualité HD 1080p à Ultra 4K, génération photo et vidéo, file d'attente prioritaire. Trouvez la formule qui vous convient.",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema({ name: "Tarifs", path: "/pricing" }),
          faqPageSchema(PRICING_FAQ, "/pricing"),
        ]}
      />
      {children}
    </>
  );
}
