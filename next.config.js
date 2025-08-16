/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'undici', '@qdrant/js-client-rest'],
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // External undici for server-side
    if (isServer) {
      config.externals.push('undici');
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "undici": false,
    };

    // Exclude test files and data directories from dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Add module rules to ignore problematic files
    config.module.rules.push(
      {
        test: /node_modules.*\/test\//,
        use: 'null-loader'
      },
      {
        test: /\.pdf$/,
        use: 'null-loader'
      }
    );

    // Ignore specific problem modules
    config.externals.push(function ({ context, request }, callback) {
      if (request && (
        request.includes('/test/data/') ||
        request.includes('test/data') ||
        request.endsWith('.pdf')
      )) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    });
    
    return config;
  },
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    QDRANT_COLLECTION: process.env.QDRANT_COLLECTION,
    JINA_API_KEY: process.env.JINA_API_KEY,
    JINA_API_URL: process.env.JINA_API_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig
