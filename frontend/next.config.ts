import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  poweredByHeader: false,

  compress: true,

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production"
          ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload"
              }
            ]
          : [])
      ]
    }
  ],

  rewrites: async () =>
    process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/backend/:path*",
            destination: "http://localhost:4000/:path*"
          }
        ]
      : [],

  images: {
    formats: ["image/avif", "image/webp"]
  },

  serverExternalPackages: ["@prisma/client"]
};

export default nextConfig;
