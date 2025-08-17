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
    icon: AcademicCapIcon,
  },
  {
    name: 'Smart Grading System',
    description: 'Automatically grade submitted papers with detailed feedback and performance analytics.',
    icon: CheckIcon,
  },
  {
    name: 'Course-Specific Content',
    description: 'Upload course materials, syllabi, and past papers for personalized paper generation.',
    icon: BookOpenIcon,
  },
  {
    name: 'Multiple Paper Variants',
    description: 'Generate multiple variants of the same paper to prevent cheating and provide variety.',
    icon: ClockIcon,
  },
  {
    name: 'Real-time Analytics',
    description: 'Track student performance, identify knowledge gaps, and improve teaching effectiveness.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Secure & Private',
    description: 'Your data is encrypted and secure. We never share your course materials or student data.',
    icon: CheckIcon,
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for individual teachers',
    features: [
      '5 paper generations per month',
      'Basic templates',
      'PDF export',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$29',
    description: 'Best for small institutions',
    features: [
      'Unlimited paper generations',
      'Advanced templates',
      'Automated grading',
      'Analytics dashboard',
      'Priority support',
      'Custom branding',
    ],
    cta: 'Start Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'Multi-institution support',
      'Advanced analytics',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function HomepageClient() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      const response = await fetch('/api/courses?limit=3')
      if (response.ok) {
        const data = await response.json()
        setFeaturedCourses(data.filter((course: Course) => course._count.materials > 0))
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden" itemScope itemType="https://schema.org/WebPageElement">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
              <div className="relative text-center lg:text-left">
                <div className="pt-10 mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
                  <div className="lg:py-24">
                    <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                      <span className="block">AI-Powered</span>
                      <span className="block text-primary-600">Exam Papers</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Transform your teaching with intelligent paper generation and automated grading. 
                      Create personalized exam papers from your course materials in minutes.
                    </p>
                    <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <button
                          onClick={() => router.push('/auth/signup')}
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                        >
                          Get Started Free
                        </button>
                      </div>
                      <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                        <Link
                          href="/courses"
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                        >
                          Browse Courses
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="/hero-image.jpg"
            alt="AI-powered education platform dashboard"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50" itemScope itemType="https://schema.org/WebPageElement">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Powerful Features for Modern Education
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to create, grade, and analyze exam papers efficiently.
            </p>
          </div>

          <div className="mt-16">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="relative" itemScope itemType="https://schema.org/Thing">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900" itemProp="name">
                      {feature.name}
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500" itemProp="description">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 bg-white" itemScope itemType="https://schema.org/WebPageElement">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Courses
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Explore some of our most popular courses with AI-generated papers.
            </p>
          </div>

          {coursesLoading ? (
            <div className="mt-16 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading featured courses...</p>
            </div>
          ) : (
            <div className="mt-16">
              {featuredCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredCourses.map((course) => (
                    <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg" itemScope itemType="https://schema.org/Course">
                      <div className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900" itemProp="name">
                              {course.name}
                            </h3>
                            <p className="text-sm text-gray-500" itemProp="courseCode">
                              {course.code}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-gray-600 text-sm line-clamp-3" itemProp="description">
                          {course.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <BookOpenIcon className="h-4 w-4 mr-1" />
                            {course._count.materials} materials
                          </div>
                          <span className="text-sm text-gray-500">
                            {course.level}
                          </span>
                        </div>
                        <Link
                          href={`/courses/${course.id}`}
                          className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
                        >
                          View Course
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No featured courses available at the moment.</p>
                </div>
              )}
              
              {featuredCourses.length > 0 && (
                <div className="mt-12 text-center">
                  <Link
                    href="/courses"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    View All Courses
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50" itemScope itemType="https://schema.org/WebPageElement">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="mt-16 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-lg shadow-lg divide-y divide-gray-200 ${plan.popular ? 'ring-2 ring-primary-500' : ''}`} itemScope itemType="https://schema.org/Offer">
                <div className="p-6">
                  {plan.popular && (
                    <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-primary-100 text-primary-600">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2" itemProp="name">
                    {plan.name}
                  </h3>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900" itemProp="price">
                      {plan.price}
                    </span>
                    <span className="text-base font-medium text-gray-500">/month</span>
                  </p>
                  <p className="mt-4 text-sm text-gray-500" itemProp="description">
                    {plan.description}
                  </p>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className="flex-shrink-0">
                          <CheckIcon className="h-6 w-6 text-green-500" />
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className={`mt-8 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-center ${
                      plan.popular
                        ? 'text-white bg-primary-600 hover:bg-primary-700'
                        : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600" itemScope itemType="https://schema.org/WebPageElement">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to transform your teaching?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-200">
            Join thousands of educators already using AI to create better exam papers.
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
          >
            Get Started Today
          </button>
        </div>
      </section>
    </main>
  )
}
