'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  GlobeAltIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Course {
  id: string
  name: string
  description: string
  code: string
  credits: number
  level: string
  boardOrUniversity: string
  language: string
  isActive: boolean
  createdAt: string
  _count: {
    materials: number
    enrollments: number
  }
}

interface CourseMaterial {
  id: string
  title: string
  description: string
  type: 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'
  fileUrl?: string
  content?: string
  year?: number
  isActive: boolean
  createdAt: string
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [selectedMaterialType, setSelectedMaterialType] = useState<'ALL' | 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'>('ALL')

  useEffect(() => {
    fetchCourse()
    fetchMaterials()
  }, [params.id])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
      } else {
        toast.error('Course not found')
        router.push('/courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course')
      router.push('/courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}/materials`)
      if (response.ok) {
        const materialsData = await response.json()
        // Only show active materials in public view
        setMaterials(materialsData.filter((material: CourseMaterial) => material.isActive))
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setMaterialsLoading(false)
    }
  }

  const filteredMaterials = materials.filter(material =>
    selectedMaterialType === 'ALL' || material.type === selectedMaterialType
  )

  const generatePaper = () => {
    if (!session) {
      toast.error('Please sign in to generate papers')
      router.push('/auth/signin')
      return
    }
    router.push(`/papers/generate?courseId=${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Course not found</h2>
          <p className="mt-1 text-sm text-gray-500">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/courses')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Courses
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{course.code}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {course.level}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <BuildingLibraryIcon className="h-4 w-4 mr-1" />
                  {course.boardOrUniversity}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {course.credits} Credits
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  {course.language}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Added {new Date(course.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0 lg:ml-8">
              <button
                onClick={generatePaper}
                className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                Generate Paper
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Available Materials</span>
                <span className="font-medium">{course._count?.materials || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Students Enrolled</span>
                <span className="font-medium">{course._count?.enrollments || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Course Level</span>
                <span className="font-medium">{course.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Credits</span>
                <span className="font-medium">{course.credits}</span>
              </div>
            </div>
          </div>

          {/* Course Materials */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Course Materials</h3>
                <div className="text-sm text-gray-500">
                  {filteredMaterials.length} materials
                </div>
              </div>

              {/* Material Type Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['ALL', 'SYLLABUS', 'OLD_PAPER', 'REFERENCE'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMaterialType(type as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedMaterialType === type
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'ALL' ? 'All Materials' : type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {materialsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading materials...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">
                    {selectedMaterialType === 'ALL' 
                      ? 'No materials available' 
                      : `No ${selectedMaterialType.replace('_', ' ').toLowerCase()} materials available`
                    }
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Materials will appear here when they are added to the course.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              material.type === 'SYLLABUS' ? 'bg-blue-100 text-blue-800' :
                              material.type === 'OLD_PAPER' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {material.type.replace('_', ' ')}
                            </span>
                            {material.year && (
                              <span className="text-sm text-gray-500">({material.year})</span>
                            )}
                          </div>
                          
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {material.title}
                          </h4>
                          
                          {material.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {material.description}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            Added: {new Date(material.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {material.fileUrl && (
                          <div className="ml-4">
                            <a
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <EyeIcon className="h-4 w-4 mr-1.5" />
                              View
                              <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
