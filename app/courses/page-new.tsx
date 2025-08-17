import type { Metadata } from 'next'
import { Suspense } from 'react'
import CoursesClient from './CoursesClient'

export const metadata: Metadata = {
  title: 'Browse All Courses - TAT Paper Generator',
  description: 'Explore our comprehensive collection of courses with AI-powered paper generation. Find courses by level, board, language, and subject area.',
  keywords: 'courses, exam papers, AI paper generation, education, online learning, course materials',
  openGraph: {
    title: 'Browse All Courses - TAT Paper Generator',
    description: 'Explore our comprehensive collection of courses with AI-powered paper generation. Find courses by level, board, language, and subject area.',
    type: 'website',
    url: '/courses',
    siteName: 'TAT Paper Generator',
    images: [
      {
        url: '/og-courses.jpg',
        width: 1200,
        height: 630,
        alt: 'TAT Paper Generator - Browse Courses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse All Courses - TAT Paper Generator',
    description: 'Explore our comprehensive collection of courses with AI-powered paper generation.',
    images: ['/og-courses.jpg'],
  },
  alternates: {
    canonical: '/courses',
  },
}

// JSON-LD structured data for better SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Course Catalog - TAT Paper Generator',
  description: 'Browse our comprehensive collection of educational courses with AI-powered paper generation capabilities.',
  url: '/courses',
  mainEntity: {
    '@type': 'ItemList',
    name: 'Available Courses',
    description: 'Educational courses with AI-powered exam paper generation',
  },
}

export default function PublicCoursesPage() {
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
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading courses...</p>
            </div>
          </div>
        </div>
      }>
        <CoursesClient />
      </Suspense>
    </>
  )
}
