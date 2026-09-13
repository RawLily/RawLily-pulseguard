/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none'
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin'
  }
];

const cspHeader = isProduction
  ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.auth0.com https://cdn.jsdelivr.net https://api.stripe.com https://js.sentry-cdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://dev-8zux3342wekcgta1.us.auth0.com https://api.stripe.com https://api.resend.com https://*.sentry.io wss://*.sentry.io; frame-src 'self' https://auth0.com https://checkout.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
  : "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: ws: wss: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; style-src 'self' 'unsafe-inline' http: https:; img-src 'self' data: https: http: blob:; font-src 'self' data: https: http:; connect-src 'self' http: https: ws: wss:; frame-src 'self' http: https:;";

const performanceHeaders = [
  {
    key: 'Cache-Control',
    value: 'public, max-age=3600, must-revalidate'
  },
  {
    key: 'ETag',
    value: 'W/"pulseguard-v1"'
  }
];

const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Compilation
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Font optimization
  experimental: {
    optimizePackageImports: ['@auth0/nextjs-auth0'],
  },

  // TypeScript strict mode
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    config.optimization.minimize = isProduction;
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Rewrites for API routes
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/health',
          destination: '/api/health',
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: '/:path*',
          destination: '/api/404',
        },
      ],
    };
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/old-pricing',
        destination: '/#pricing',
        permanent: true,
      },
    ];
  },

  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          ...performanceHeaders,
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none';",
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: https:; font-src 'self' data: https:;",
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800',
          },
        ],
      },
    ];
  },

  // Output
  output: isProduction ? 'standalone' : undefined,

  // Trailing slash
  trailingSlash: false,

  // Internationalization (if needed)
  i18n: undefined,

  // SWC compiler options
  swcMinifyOptions: isProduction ? {
    compress: {
      passes: 3,
      pure_getters: true,
      pure_funcs: null,
      unsafe: false,
      unsafe_arrows: false,
      unsafe_methods: false,
      unsafe_proto: false,
      unsafe_regexp: false,
      unused: true,
    },
    mangle: {
      safari10: true,
    },
  } : undefined,

  // Vercel analytics
  analytics: {
    enabled: isProduction,
  },

  // Timeout configuration
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },

  // Build configuration
  build: {
    shallowUnstable: false,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: isDevelopment,
      hmrRefresh: isDevelopment,
    },
  },
};

module.exports = nextConfig;
