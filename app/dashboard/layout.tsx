import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

/**
 * Espace applicatif privé : hors index. Le canonical reste déclaré pour que,
 * si l'URL est partagée, elle soit reconnue comme la seule version de la page.
 */
export const metadata: Metadata = pageMetadata({
  path: "/dashboard",
  title: "Mon espace — AstraCrea",
  description: "Générez vos images, suivez vos crédits et retrouvez votre historique AstraCrea.",
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
