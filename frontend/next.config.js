/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enhanced security headers
  headers: async () => {
    // Build a Content-Security-Policy. This is the main XSS blast-radius
    // reducer: even if a script is injected, it can't exfiltrate data to an
    // arbitrary host (connect-src), load plugins (object-src), or be framed
    // (frame-ancestors). Allow the API + socket origins for fetch/websocket.
    const api = process.env.NEXT_PUBLIC_API_URL || "https://last-piece-4l3u.onrender.com/api";
    const apiOrigin = api.replace(/\/api\/?$/, "");
    const socket = process.env.NEXT_PUBLIC_SOCKET_URL || apiOrigin;
    const wsOrigins = [apiOrigin, socket]
      .map((o) => o.replace(/^http/, "ws"))
      .join(" ");
    const connectSrc = [
      "'self'",
      apiOrigin,
      socket,
      wsOrigins,
      "http://localhost:5001",
      "ws://localhost:5001",
    ].join(" ");
    const csp = [
      "default-src 'self'",
      // Next.js injects inline hydration scripts; without a nonce pipeline we
      // allow inline. unsafe-eval kept only in dev (Next fast-refresh needs it).
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: csp,
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(self)",
        },
      ],
    },
    ];
  },

  // Compression
  compress: true,

  // Performance optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: "commons",
            chunks: "all",
            minChunks: 2,
          },
          react: {
            name: "react",
            chunks: "all",
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          },
        },
      };
    }
    return config;
  },

  rewrites: async () => ({
    beforeFiles: [],
  }),

  // Serve SVG favicon for /favicon.ico to avoid 404
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: false },
    ];
  },
};

module.exports = nextConfig;
