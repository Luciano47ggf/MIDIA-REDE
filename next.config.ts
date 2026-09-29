import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As imagens da galeria já são miniaturas geradas no upload e servidas pela CDN do R2.
  // Por isso usamos <img> comum e não gastamos a cota de otimização de imagens da Vercel.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
