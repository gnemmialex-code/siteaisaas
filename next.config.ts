import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet de lancer un 2e serveur de dev en parallèle (aperçu mobile sur :3001)
  // en isolant son dossier de build : NEXT_DIST_DIR=.next-preview next dev -p 3001
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["sharp"],
  // Embarque la vidéo privée Snap Rouge dans le bundle serveur (Vercel)
  outputFileTracingIncludes: {
    "/api/snap-rouge/video": ["./private-videos/**"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 n'autorise que les qualités déclarées ici ; toute autre valeur
    // passée à <Image quality> est ignorée et retombe silencieusement sur 75.
    // 55 sert aux tuiles décoratives du fond du hero, masquées par des voiles.
    qualities: [55, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbxt.replicate.delivery",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
