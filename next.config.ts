import type { NextConfig } from "next";

const isExport = process.env.BUILD_APK === "true";

const nextConfig: NextConfig = {
  // Cuando BUILD_APK=true, exportar estático para el APK
  // Cuando no, usar standalone para el servidor
  output: isExport ? "export" : "standalone",
  // Necesario para export estático con imágenes
  images: isExport ? { unoptimized: true } : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
