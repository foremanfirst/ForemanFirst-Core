import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "supreme-space-invention-6vvjvv9gijxpfr464-3000.app.github.dev",
      ],
    },
  },
};

export default nextConfig;