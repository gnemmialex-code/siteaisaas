import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/register",
  title: "Créer un compte gratuit — AstraCrea",
  description:
    "Créez votre compte AstraCrea en quelques secondes et générez votre première photo de montre de luxe par IA, sans carte bancaire.",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
