import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

/**
 * Fil d'Ariane de /terms. Volontairement dans un layout plutôt que dans la
 * page : le contenu de la page légale n'est pas modifié.
 * La metadata, elle, reste portée par page.tsx.
 */
export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema({
          name: "Conditions Générales d'Utilisation",
          path: "/terms",
        })}
      />
      {children}
    </>
  );
}
