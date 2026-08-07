import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

/** Contenu exclusif débloqué à l'achat : hors index. */
export const metadata: Metadata = pageMetadata({
  path: "/snap-rouge",
  title: "La technique Snap Rouge — AstraCrea",
  description: "Guide exclusif Snap Rouge, réservé aux membres AstraCrea.",
  noIndex: true,
});

export default function SnapRougeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
