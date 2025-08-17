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
  LockClosedIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import SecurePDFViewer from '@/components/SecurePDFViewer'

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
  hasFile: boolean
  requiresAuth?: boolean // Flag to show authentication requirement
  content?: string
  year?: number
  createdAt: string
}

interface CourseDetailClientProps {
  courseId: string
}

export default function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [selectedMaterialType, setSelectedMaterialType] = useState<'ALL' | 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'>('ALL')
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'type'>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  
  // Secure PDF viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)

  useEffect(() => {
    fetchCourse()
    fetchMaterials()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
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
      // Use public endpoint to show materials list (SEO-friendly)
      const response = await fetch(`/api/courses/${courseId}/materials/public`)
      
      if (response.ok) {
        const materialsData = await response.json()
        setMaterials(materialsData)
      } else {
        console.error('Failed to fetch materials')
        setMaterials([])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      setMaterials([])
    } finally {
      setMaterialsLoading(false)
    }
  }

  const filteredMaterials = materials
    .filter(material => {
      // Filter by type
      const typeMatch = selectedMaterialType === 'ALL' || material.type === selectedMaterialType
      
      // Filter by year
      const yearMatch = yearFilter === 'ALL' || (material.year && material.year.toString() === yearFilter)
      
      // Filter by search term
      const searchMatch = searchTerm === '' || 
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        material.type.toLowerCase().replace('_', ' ').includes(searchTerm.toLowerCase()) ||
        (material.year && material.year.toString().includes(searchTerm))
      
      return typeMatch && yearMatch && searchMatch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

  const handleGeneratePaper = () => {
    if (session) {
      router.push(`/papers/generate?courseId=${courseId}`)
    } else {
      toast.error('Please sign in to generate papers')
      router.push('/auth/signin')
    }
  }

  const handleViewMaterial = (material: CourseMaterial) => {
    if (!session) {
      toast.error('Please sign in to view materials')
      router.push('/auth/signin')
      return
    }

    if (material.hasFile) {
      setSelectedMaterial(material)
      setViewerOpen(true)
    } else if (material.content) {
      // Show content in a modal or new page
      console.log('Material content:', material.content)
      toast('Text content viewing not implemented yet')
    } else {
      toast.error('No content available for this material')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'SYLLABUS':
        return DocumentTextIcon
      case 'OLD_PAPER':
        return BookOpenIcon
      case 'REFERENCE':
        return EyeIcon
      default:
        return DocumentTextIcon
    }
  }

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'SYLLABUS':
        return 'Syllabus'
      case 'OLD_PAPER':
        return 'Previous Papers'
      case 'REFERENCE':
        return 'Reference Material'
      default:
        return type
    }
  }

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Get available years for filtering
  const availableYears = Array.from(new Set(
    materials
      .filter(m => m.year)
      .map(m => m.year!.toString())
  )).sort((a, b) => parseInt(b) - parseInt(a))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading course details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">The requested course could not be found.</p>
            <button
              onClick={() => router.push('/courses')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to courses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-12 w-12 text-primary-600" />
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                  <p className="text-lg text-gray-600">{course.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Level</p>
                    <p className="font-medium">{course.level}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Credits</p>
                    <p className="font-medium">{course.credits}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Language</p>
                    <p className="font-medium">{course.language}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <BuildingLibraryIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Board</p>
                    <p className="font-medium">{course.boardOrUniversity}</p>
                  </div>
                </div>
              </div>

              {course.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Course Description</h2>
                  <p className="text-gray-700 leading-relaxed">{course.description}</p>
                </div>
              )}

              {/* Course Materials */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 sm:mb-0">Course Materials</h2>
                  <div className="flex items-center space-x-2">
                    {/* Quick Search */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Quick search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500 w-40"
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center px-3 py-2 text-sm rounded ${
                        showFilters || selectedMaterialType !== 'ALL' || yearFilter !== 'ALL' || sortBy !== 'newest'
                          ? 'text-primary-700 bg-primary-50 border border-primary-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <FunnelIcon className="h-4 w-4 mr-1" />
                      Filters
                      {(selectedMaterialType !== 'ALL' || yearFilter !== 'ALL' || sortBy !== 'newest') && (
                        <span className="ml-1 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {[selectedMaterialType !== 'ALL', yearFilter !== 'ALL', sortBy !== 'newest'].filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                  {/* Filter Controls */}
                  {showFilters && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      {/* Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Material Type</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedMaterialType('ALL')}
                            className={`px-3 py-1 text-sm rounded ${
                              selectedMaterialType === 'ALL'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            All ({materials.length})
                          </button>
                          <button
                            onClick={() => setSelectedMaterialType('SYLLABUS')}
                            className={`px-3 py-1 text-sm rounded ${
                              selectedMaterialType === 'SYLLABUS'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            Syllabus ({materials.filter(m => m.type === 'SYLLABUS').length})
                          </button>
                          <button
                            onClick={() => setSelectedMaterialType('OLD_PAPER')}
                            className={`px-3 py-1 text-sm rounded ${
                              selectedMaterialType === 'OLD_PAPER'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            Papers ({materials.filter(m => m.type === 'OLD_PAPER').length})
                          </button>
                          <button
                            onClick={() => setSelectedMaterialType('REFERENCE')}
                            className={`px-3 py-1 text-sm rounded ${
                              selectedMaterialType === 'REFERENCE'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            References ({materials.filter(m => m.type === 'REFERENCE').length})
                          </button>
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title' | 'type')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="title">Title (A-Z)</option>
                          <option value="type">Type</option>
                        </select>
                      </div>

                      {/* Year Filter */}
                      {availableYears.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Year</label>
                          <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          >
                            <option value="ALL">All Years</option>
                            {availableYears.map(year => (
                              <option key={year} value={year}>
                                {year} ({materials.filter(m => m.year?.toString() === year).length})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Clear Filters */}
                      {(searchTerm || selectedMaterialType !== 'ALL' || sortBy !== 'newest' || yearFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedMaterialType('ALL')
                            setSortBy('newest')
                            setYearFilter('ALL')
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}

                  {/* Results Summary */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Showing {filteredMaterials.length} of {materials.length} materials
                      {searchTerm && ` for "${searchTerm}"`}
                    </span>
                    {filteredMaterials.length !== materials.length && (
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setSelectedMaterialType('ALL')
                          setYearFilter('ALL')
                        }}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Show all
                      </button>
                    )}
                  </div>
                </div>

                {materialsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading materials...</p>
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No materials found for this filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMaterials.map((material) => {
                      const IconComponent = getMaterialIcon(material.type)
                      return (
                        <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start flex-1">
                              <IconComponent className="h-6 w-6 text-primary-600 mt-1 mr-3" />
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">
                                  {highlightSearchTerm(material.title, searchTerm)}
                                </h3>
                                {material.description && (
                                  <p className="text-gray-600 text-sm mb-2">
                                    {highlightSearchTerm(material.description, searchTerm)}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="bg-gray-100 px-2 py-1 rounded">
                                    {getMaterialTypeLabel(material.type)}
                                  </span>
                                  {material.year && (
                                    <span className="flex items-center">
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      {material.year}
                                    </span>
                                  )}
                                  <span>Added {formatDate(material.createdAt)}</span>
                                </div>
                                {!session && (
                                  <div className="mt-2 flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    <LockClosedIcon className="h-3 w-3 mr-1" />
                                    Sign in required to view content
                                  </div>
                                )}
                              </div>
                            </div>
                            {(material.hasFile || material.content) && (
                              <button
                                onClick={() => handleViewMaterial(material)}
                                className={`flex items-center px-3 py-2 text-sm rounded ml-4 ${
                                  !session 
                                    ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200' 
                                    : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                                }`}
                              >
                                {!session ? (
                                  <LockClosedIcon className="h-4 w-4 mr-1" />
                                ) : (
                                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                                )}
                                {!session ? 'Sign in to View' : 'View'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Materials</span>
                  <span className="font-medium">{course._count.materials}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Students</span>
                  <span className="font-medium">{course._count.enrollments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Added</span>
                  <span className="font-medium">{formatDate(course.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Generate Paper CTA */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-2">Generate AI Paper</h3>
              <p className="text-primary-100 text-sm mb-4">
                Create customized exam papers for this course using our AI-powered generator.
              </p>
              <button
                onClick={handleGeneratePaper}
                className="w-full bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Generate Paper
              </button>
              {!session && (
                <p className="text-primary-100 text-xs mt-2 text-center">
                  Sign in required
                </p>
              )}
            </div>

            {/* Materials Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Study Materials</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Materials:</span>
                  <span className="font-medium">{materials.length}</span>
                </div>
                {materials.filter(m => m.type === 'SYLLABUS').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Syllabus:</span>
                    <span className="font-medium">{materials.filter(m => m.type === 'SYLLABUS').length}</span>
                  </div>
                )}
                {materials.filter(m => m.type === 'OLD_PAPER').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Papers:</span>
                    <span className="font-medium">{materials.filter(m => m.type === 'OLD_PAPER').length}</span>
                  </div>
                )}
                {materials.filter(m => m.type === 'REFERENCE').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">References:</span>
                    <span className="font-medium">{materials.filter(m => m.type === 'REFERENCE').length}</span>
                  </div>
                )}
              </div>
              {!session && materials.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center">
                    <LockClosedIcon className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-xs text-amber-800 font-medium">Sign in to access all materials</span>
                  </div>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Course Code:</span>
                  <span className="ml-2 font-medium">{course.code}</span>
                </div>
                <div>
                  <span className="text-gray-600">Level:</span>
                  <span className="ml-2 font-medium">{course.level}</span>
                </div>
                <div>
                  <span className="text-gray-600">Credits:</span>
                  <span className="ml-2 font-medium">{course.credits}</span>
                </div>
                <div>
                  <span className="text-gray-600">Language:</span>
                  <span className="ml-2 font-medium">{course.language}</span>
                </div>
                <div>
                  <span className="text-gray-600">Board/University:</span>
                  <span className="ml-2 font-medium">{course.boardOrUniversity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secure PDF Viewer Modal */}
      {selectedMaterial && (
        <SecurePDFViewer
          materialId={selectedMaterial.id}
          title={selectedMaterial.title}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false)
            setSelectedMaterial(null)
          }}
        />
      )}
    </div>
  )
}
