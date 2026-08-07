import type { Metadata } from "next";

/** Page d'aperçu interne pour le développement : ne doit jamais être indexée. */
export const metadata: Metadata = {
  title: "Aperçu mobile (interne) — AstraCrea",
  robots: { index: false, follow: false },
};

export default function PreviewMobileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
