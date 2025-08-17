'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Course {
  id: string
  name: string
  description: string
  level: string
  boardOrUniversity: string
}

interface PaperRequest {
  courseId: string
  examType: string
  totalMarks: number
  durationMinutes: number
  topicsInclude: string[]
  topicsExclude: string[]
  difficultyPref?: {
    easy: number
    medium: number
    hard: number
  }
  styleOverrides?: string
  variantCount: number
}

export default function GeneratePaperPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [formData, setFormData] = useState<PaperRequest>({
    courseId: '',
    examType: 'Midterm',
    totalMarks: 100,
    durationMinutes: 120,
    topicsInclude: [],
    topicsExclude: [],
    variantCount: 1,
  })

  const [topicsInput, setTopicsInput] = useState('')
  const [excludeTopicsInput, setExcludeTopicsInput] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchCourses()
    }
  }, [session])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.courseId) {
      toast.error('Please select a course')
      return
    }

    if (formData.topicsInclude.length === 0) {
      toast.error('Please include at least one topic')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/papers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Paper generated successfully!')
        router.push(`/papers/${data.paperRequest.id}`)
      } else {
        if (data.code === 'quota_exhausted') {
          toast.error('Monthly paper limit exceeded. Please upgrade your plan.')
        } else {
          toast.error(data.error || 'Failed to generate paper')
        }
      }
    } catch (error) {
      console.error('Error generating paper:', error)
      toast.error('An error occurred while generating the paper')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTopicsChange = (value: string, type: 'include' | 'exclude') => {
    const topics = value.split(',').map(t => t.trim()).filter(t => t)
    
    if (type === 'include') {
      setFormData(prev => ({ ...prev, topicsInclude: topics }))
    } else {
      setFormData(prev => ({ ...prev, topicsExclude: topics }))
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate New Paper</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection */}
              <div>
                <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course *
                </label>
                <select
                  id="courseId"
                  value={formData.courseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} - {course.boardOrUniversity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Type */}
              <div>
                <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  id="examType"
                  value={formData.examType}
                  onChange={(e) => setFormData(prev => ({ ...prev, examType: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Unit Test">Unit Test</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </div>

              {/* Paper Specifications */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    id="totalMarks"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalMarks: parseInt(e.target.value) }))}
                    min="10"
                    max="200"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                    min="30"
                    max="300"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Topics */}
              <div>
                <label htmlFor="topicsInclude" className="block text-sm font-medium text-gray-700 mb-2">
                  Topics to Include * (comma-separated)
                </label>
                <input
                  type="text"
                  id="topicsInclude"
                  value={topicsInput}
                  onChange={(e) => {
                    setTopicsInput(e.target.value)
                    handleTopicsChange(e.target.value, 'include')
                  }}
                  placeholder="e.g., Calculus, Algebra, Trigonometry"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="topicsExclude" className="block text-sm font-medium text-gray-700 mb-2">
                  Topics to Exclude (comma-separated)
                </label>
                <input
                  type="text"
                  id="topicsExclude"
                  value={excludeTopicsInput}
                  onChange={(e) => {
                    setExcludeTopicsInput(e.target.value)
                    handleTopicsChange(e.target.value, 'exclude')
                  }}
                  placeholder="e.g., Advanced Calculus, Complex Analysis"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              {/* Variant Count */}
              <div>
                <label htmlFor="variantCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Variants
                </label>
                <input
                  type="number"
                  id="variantCount"
                  value={formData.variantCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, variantCount: parseInt(e.target.value) }))}
                  min="1"
                  max="5"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Generate multiple variants of the same paper
                </p>
              </div>

              {/* Style Overrides */}
              <div>
                <label htmlFor="styleOverrides" className="block text-sm font-medium text-gray-700 mb-2">
                  Style Overrides (optional)
                </label>
                <textarea
                  id="styleOverrides"
                  value={formData.styleOverrides || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, styleOverrides: e.target.value }))}
                  rows={3}
                  placeholder="e.g., Include more case studies, focus on practical applications"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Paper...
                    </>
                  ) : (
                    'Generate Paper'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
