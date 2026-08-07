import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contacter l'équipe AstraCrea — Support et questions",
  description:
    "Une question sur une génération, votre abonnement ou la qualité d'un rendu ? Écrivez à l'équipe AstraCrea : support, partenariats et retours d'expérience.",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
