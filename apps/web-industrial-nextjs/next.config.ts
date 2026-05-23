import path from "node:path";
import type { NextConfig } from "next";

const commerceBff = process.env.COMMERCE_BFF_URL ?? "http://127.0.0.1:3210";

const nextConfig: NextConfig = {
  transpilePackages: ["commerce-humanized-errors", "enterprise-commercial-governance"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async rewrites() {
    return [
      {
        source: "/api/producer/:path*",
        destination: `${commerceBff}/api/producer/:path*`,
      },
      {
        source: "/api/grossiste-a/:path*",
        destination: `${commerceBff}/api/grossiste-a/:path*`,
      },
      {
        source: "/api/commercial-context",
        destination: `${commerceBff}/api/commercial-context`,
      },
      {
        source: "/api/notifications/:path*",
        destination: `${commerceBff}/api/notifications/:path*`,
      },
      {
        source: "/api/activity-feed/:path*",
        destination: `${commerceBff}/api/activity-feed/:path*`,
      },
      {
        source: "/api/offline/:path*",
        destination: `${commerceBff}/api/offline/:path*`,
      },
    ];
  },
};

export default nextConfig;
