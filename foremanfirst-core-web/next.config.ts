import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "supreme-space-invention-6vvjvv9gijxpfr464-3000.app.github.dev",
        "supreme-space-invention-6vvjvv9gijxpfr464-3001.app.github.dev",
      ],
    },
  },
};

export default nextConfig;