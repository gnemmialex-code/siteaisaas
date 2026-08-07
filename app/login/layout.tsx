import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/login",
  title: "Connexion à votre compte — AstraCrea",
  description:
    "Connectez-vous à votre compte AstraCrea pour retrouver vos générations, votre historique et votre abonnement.",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
