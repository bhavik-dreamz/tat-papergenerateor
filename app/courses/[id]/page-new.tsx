import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CourseDetailClient from './CourseDetailClient'

interface CoursePageProps {
  params: { id: string }
}

// Function to get course data for metadata
async function getCourse(id: string) {
  try {
    const course = await prisma.course.findFirst({
      where: {
        id,
        isActive: true
      },
      include: {
        _count: {
          select: {
            materials: {
              where: { isActive: true }
            },
            enrollments: true
          }
        }
      }
    })

    return course
  } catch (error) {
    console.error('Error fetching course:', error)
    return null
  }
}

// Dynamic metadata generation
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const course = await getCourse(params.id)

  if (!course) {
    return {
      title: 'Course Not Found - TAT Paper Generator',
      description: 'The requested course could not be found.',
    }
  }

  const title = `${course.name} - TAT Paper Generator`
  const description = course.description 
    ? `${course.description.substring(0, 155)}...`
    : `Learn ${course.name} with AI-powered paper generation and automated grading. ${course.level} level course from ${course.boardOrUniversity}.`

  return {
    title,
    description,
    keywords: `${course.name}, ${course.code}, ${course.level}, ${course.boardOrUniversity}, ${course.language}, course, exam papers, AI paper generation`,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/courses/${course.id}`,
      siteName: 'TAT Paper Generator',
      images: [
        {
          url: '/og-course-detail.jpg',
          width: 1200,
          height: 630,
          alt: `${course.name} - Course Details`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-course-detail.jpg'],
    },
    alternates: {
      canonical: `/courses/${course.id}`,
    },
  }
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const course = await getCourse(params.id)

  if (!course) {
    notFound()
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description || `${course.level} level course in ${course.name}`,
    courseCode: course.code,
    educationalLevel: course.level,
    inLanguage: course.language,
    provider: {
      '@type': 'Organization',
      name: course.boardOrUniversity,
    },
    url: `/courses/${course.id}`,
    coursePrerequisites: course.level,
    timeRequired: `${course.credits} credits`,
    aggregateRating: course._count.enrollments > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: course._count.enrollments,
    } : undefined,
    offers: {
      '@type': 'Offer',
      category: 'Educational Service',
      availability: 'https://schema.org/InStock',
    }
  }

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
              <p className="text-gray-600 mt-4">Loading course details...</p>
            </div>
          </div>
        </div>
      }>
        <CourseDetailClient courseId={params.id} />
      </Suspense>
    </>
  )
}
