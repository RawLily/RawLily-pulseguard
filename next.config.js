/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }
];

const cspHeader = isProduction
  ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.auth0.com https://cdn.jsdelivr.net https://api.stripe.com https://js.sentry-cdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://dev-8zux3342wekcgta1.us.auth0.com https://api.stripe.com https://api.resend.com https://*.sentry.io wss://*.sentry.io; frame-src 'self' https://auth0.com https://checkout.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
  : "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: ws: wss: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; style-src 'self' 'unsafe-inline' http: https:; img-src 'self' data: https: http: blob:; font-src 'self' data: https: http:; connect-src 'self' http: https: ws: wss:; frame-src 'self' http: https:;";

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,
  trailingSlash: false,

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    optimizePackageImports: ['@auth0/nextjs-auth0'],
  },

  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  webpack: (config, { isServer }) => {
    config.optimization.minimize = isProduction;
    return config;
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: '/health', destination: '/api/health' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    return [
      { source: '/admin', destination: '/dashboard', permanent: true },
      { source: '/old-pricing', destination: '/#pricing', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none';" },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  output: isProduction ? 'standalone' : undefined,

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;
