import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstraCrea — Transformations IA Ultra HD",
  description:
    "Transformez vos photos avec la technologie IA Ultra HD d'AstraCrea. Résultats 4K en quelques secondes.",
  keywords: ["AstraCrea", "IA", "photo", "transformation", "ultra hd", "face swap"],
  openGraph: {
    title: "AstraCrea — Transformations IA Ultra HD",
    description: "Transformez vos photos avec l'IA Ultra HD d'AstraCrea",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-background text-foreground antialiased">
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
      </body>
    </html>
  );
}
