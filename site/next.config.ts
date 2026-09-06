import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Light security headers (seo-technical): HSTS comes from Vercel;
  // CSP is deliberately not set here (inline Next scripts would need a
  // nonce pipeline — not worth it for a static marketing site).
  // /privacy-policy is a guessable alias people (and at least one store
  // listing field) use for /privacy — GSC reported it 404ing on
  // 2026-09-05. Permanent redirects, with and without a locale prefix;
  // same courtesy for /terms.
  async redirects() {
    return [
      {
        source: "/:locale/privacy-policy",
        destination: "/:locale/privacy",
        permanent: true,
      },
      { source: "/privacy-policy", destination: "/en/privacy", permanent: true },
      {
        source: "/:locale/terms-of-service",
        destination: "/:locale/terms",
        permanent: true,
      },
      { source: "/terms-of-service", destination: "/en/terms", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
