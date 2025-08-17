import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/papers/generate/',
          '/_next/',
          '/uploads/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/courses/',
          '/auth/signin',
          '/auth/signup',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/papers/generate/',
        ],
      },
    ],
    sitemap: 'https://tat-paper-generator.com/sitemap.xml',
  }
}
