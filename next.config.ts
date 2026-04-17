import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["prisma", "bcryptjs", "formidable", "archiver", "node-cron"],
};

export default nextConfig;
