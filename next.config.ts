import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript:{
        ignoreBuildErrors: true,
    },
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns : [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            }
        ],
        // Allow data URLs for base64 images
        unoptimized: false,
    },
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
