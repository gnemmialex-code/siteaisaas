import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

/** Résultat d'une génération, propre à un utilisateur : hors index. */
export const metadata: Metadata = pageMetadata({
  path: "/result",
  title: "Votre résultat — AstraCrea",
  description: "Le rendu de votre génération AstraCrea.",
  noIndex: true,
});

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
