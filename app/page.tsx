'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckIcon, AcademicCapIcon, BookOpenIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface Course {
  id: string
  name: string
  description: string
  code: string
  credits: number
  level: string
  boardOrUniversity: string
  language: string
  _count: {
    materials: number
    enrollments: number
  }
}

const features = [
  {
    name: 'AI-Powered Paper Generation',
    description: 'Generate high-quality exam papers using advanced AI models trained on course-specific materials.',
  },
  {
    name: 'Smart Grading System',
    description: 'Automatically grade submitted papers with detailed feedback and performance analytics.',
  },
  {
    name: 'Course-Specific Content',
    description: 'Upload course materials, syllabi, and past papers for personalized paper generation.',
  },
  {
    name: 'Multiple Paper Variants',
    description: 'Generate multiple variants of the same paper to prevent cheating and provide variety.',
  },
  {
    name: 'Real-time Analytics',
    description: 'Track student performance, identify knowledge gaps, and improve teaching effectiveness.',
  },
  {
    name: 'Secure & Private',
    description: 'Your data is encrypted and secure. We never share your course materials or student data.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out the platform',
    features: [
      '1 paper per month',
      'Basic paper generation',
      'Standard grading',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Medium',
    price: '$19',
    period: '/month',
    description: 'Great for individual teachers',
    features: [
      '5 papers per month',
      'Advanced paper generation',
      'Detailed grading with feedback',
      'Multiple paper variants',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'Perfect for institutions and teams',
    features: [
      'Unlimited papers',
      'Premium AI models',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
]

export default function HomePage() {
  const router = useRouter()
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const courses = await response.json()
        // Show first 3 courses as featured
        setFeaturedCourses(courses.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Generate Exam Papers with{' '}
                <span className="text-primary-600">AI Intelligence</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create high-quality, course-specific exam papers in minutes. Upload your materials, 
                specify requirements, and let our AI generate papers that match your teaching style.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Get started
                </Link>
                <button
                  onClick={() => router.push('/courses')}
                  className="text-sm font-semibold leading-6 text-gray-900 flex items-center"
                >
                  Browse courses <ArrowRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      {/* Featured Courses section */}
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Featured Courses</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Explore our popular courses
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Start generating papers for these featured courses with comprehensive materials and resources.
          </p>
        </div>

        {loading ? (
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col bg-white p-6 shadow-sm ring-1 ring-gray-900/10 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {featuredCourses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col bg-white p-6 shadow-sm ring-1 ring-gray-900/10 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/courses/${course.id}`)}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.name}
                  </h3>
                  <p className="text-sm text-primary-600 font-medium mb-1">{course.code}</p>
                  <p className="text-sm text-gray-600 mb-2">{course.boardOrUniversity}</p>
                </div>

                <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {course.credits} Credits
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {course.level}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                  <span>{course.language}</span>
                  <div className="flex items-center space-x-3">
                    {course._count?.materials > 0 && (
                      <span className="flex items-center">
                        <BookOpenIcon className="h-3 w-3 mr-1" />
                        {course._count.materials} Materials
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-16 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No courses available yet. Check back soon!</p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => router.push('/courses')}
            className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 flex items-center"
          >
            View All Courses
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Advanced Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to create perfect exam papers
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our AI-powered platform combines the best of technology and education to help you create 
            high-quality, engaging, and effective exam papers.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Pricing section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for you
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
            Start with our free plan and upgrade as your needs grow. All plans include our core features.
          </p>
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {plans.map((plan, planIdx) => (
              <div
                key={plan.name}
                className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                  plan.popular ? 'ring-2 ring-primary-600' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">{plan.name}</h3>
                    {plan.popular && (
                      <p className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">
                        Most popular
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm font-semibold leading-6 text-gray-600">{plan.period}</span>
                    )}
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/auth/signup"
                  className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    plan.popular
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500 focus-visible:outline-primary-600'
                      : 'text-primary-600 ring-1 ring-inset ring-primary-200 hover:ring-primary-300 focus-visible:outline-primary-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/privacy" className="text-gray-400 hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-gray-300">
              Terms of Service
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; 2024 TAT Paper Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
