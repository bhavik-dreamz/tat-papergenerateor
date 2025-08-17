import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomepageClient from './HomepageClient'

export const metadata: Metadata = {
  title: 'TAT Paper Generator - AI-Powered Exam Papers & Automated Grading',
  description: 'Transform education with AI-powered exam paper generation and automated grading. Create personalized papers from course materials with intelligent assessment tools.',
  keywords: 'AI exam papers, automated grading, paper generator, course materials, education technology, online testing, smart assessment',
  openGraph: {
    title: 'TAT Paper Generator - AI-Powered Exam Papers & Automated Grading',
    description: 'Transform education with AI-powered exam paper generation and automated grading. Create personalized papers from course materials with intelligent assessment tools.',
    type: 'website',
    url: '/',
    siteName: 'TAT Paper Generator',
    images: [
      {
        url: '/og-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'TAT Paper Generator - AI-Powered Education Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TAT Paper Generator - AI-Powered Education',
    description: 'Transform education with AI-powered exam paper generation and automated grading.',
    images: ['/og-homepage.jpg'],
  },
  alternates: {
    canonical: '/',
  },
}

// JSON-LD structured data for the homepage
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TAT Paper Generator',
  description: 'AI-powered exam paper generation and automated grading platform for educational institutions.',
  url: '/',
  potentialAction: {
    '@type': 'SearchAction',
    target: '/courses?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'TAT Paper Generator',
    description: 'Leading AI-powered educational technology platform',
    url: '/',
    logo: {
      '@type': 'ImageObject',
      url: '/logo.png',
    },
  },
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'TAT Paper Generator',
    applicationCategory: 'Educational Technology',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
    },
  },
}

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      
      <Suspense fallback={
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      }>
        <HomepageClient />
      </Suspense>
    </>
  )
}
