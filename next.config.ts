import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["lighthouse", "chrome-launcher"],
};

export default nextConfig;
