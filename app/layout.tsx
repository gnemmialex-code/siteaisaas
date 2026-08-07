import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import JsonLd from "./components/JsonLd";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Metadata de repli, héritée par toute route qui n'exporte pas la sienne.
 * Volontairement sans `alternates.canonical` : un canonical défini ici serait
 * hérité par les pages qui n'en déclarent pas et les ferait toutes pointer vers
 * la même URL. Chaque page publique appelle pageMetadata() (lib/seo.ts).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {/* Identité du site, valable sur toutes les pages. Les schémas propres
            à une page (FAQPage, BreadcrumbList…) sont injectés par la page. */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1E1E1E",
              color: "#fff",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
            },
            success: {
              iconTheme: { primary: "#8A2BE2", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
