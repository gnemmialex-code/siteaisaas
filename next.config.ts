import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["sharp"],
  // Embarque la vidéo privée Snap Rouge dans le bundle serveur (Vercel)
  outputFileTracingIncludes: {
    "/api/snap-rouge/video": ["./private-videos/**"],
  },
  images: {
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
