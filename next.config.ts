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
