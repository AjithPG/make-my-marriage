import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV !== "production";

// Public media domain on R2 (e.g. https://media.makemymarriage.in), read at build time.
const mediaOrigin = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).origin
  : null;

/**
 * CSP without nonces: nonces would force dynamic rendering and defeat the
 * cached guest pages. Tighten once the app's real script needs are known.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${mediaOrigin ? ` ${mediaOrigin}` : ""}`,
  "font-src 'self'",
  // Browsers PUT photos straight to R2 with presigned URLs.
  `connect-src 'self' https://*.r2.cloudflarestorage.com${isDev ? " ws:" : ""}`,
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: mediaOrigin ? [new URL(`${mediaOrigin}/**`)] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// English only, no locale routing; config lives in src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
