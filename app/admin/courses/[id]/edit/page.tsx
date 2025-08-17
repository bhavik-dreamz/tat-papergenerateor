'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline'

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  code: z.string().min(1, 'Course code is required'),
  credits: z.number().min(1).max(10),
  level: z.string().min(1, 'Level is required'),
  boardOrUniversity: z.string().min(1, 'Board/University is required'),
  language: z.string().min(1, 'Language is required'),
  isActive: z.boolean(),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseMaterial {
  id: string
  title: string
  description: string
  type: 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'
  fileUrl?: string
  content?: string
  year?: number
  weightings?: any
  styleNotes?: string
  isActive: boolean
  createdAt: string
}

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [materialType, setMaterialType] = useState<'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'>('SYLLABUS')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialDescription, setMaterialDescription] = useState('')
  const [materialYear, setMaterialYear] = useState<number | undefined>()
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [sortBy, setSortBy] = useState<'title' | 'type' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  })

  const isActive = watch('isActive')

  // Filter and sort materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'ALL' || material.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]

    if (sortBy === 'createdAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMaterials = sortedMaterials.slice(startIndex, endIndex)

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter])

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user?.role !== 'SUPER_ADMIN' && session.user?.role !== 'TEAM')) {
      router.push('/auth/signin')
      return
    }

    fetchCourse()
    fetchMaterials()
  }, [session, status, params.id])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${params.id}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
        
        // Set form values
        setValue('name', courseData.name)
        setValue('description', courseData.description)
        setValue('code', courseData.code)
        setValue('credits', courseData.credits)
        setValue('level', courseData.level)
        setValue('boardOrUniversity', courseData.boardOrUniversity)
        setValue('language', courseData.language)
        setValue('isActive', courseData.isActive)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course')
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`/api/admin/materials?courseId=${params.id}`)
      if (response.ok) {
        const materialsData = await response.json()
        setMaterials(materialsData)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/courses/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Course updated successfully')
        router.push('/admin?tab=courses')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Failed to update course')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const uploadMaterial = async () => {
    if (!selectedFile || !materialTitle.trim()) {
      toast.error('Please select a file and enter a title')
      return
    }

    setUploading(true)
    try {
      // First upload the file
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('courseId', params.id)
      formData.append('title', materialTitle)
      formData.append('description', materialDescription)
      formData.append('type', materialType)
      if (materialYear) {
        formData.append('year', materialYear.toString())
      }

      const response = await fetch('/api/admin/materials/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Material uploaded and processed successfully')
        
        // Reset form
        setSelectedFile(null)
        setMaterialTitle('')
        setMaterialDescription('')
        setMaterialYear(undefined)
        
        // Refresh materials list
        fetchMaterials()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload material')
      }
    } catch (error) {
      console.error('Error uploading material:', error)
      toast.error('Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  const deleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const response = await fetch(`/api/admin/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Material deleted successfully')
        fetchMaterials()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete material')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Failed to delete material')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  if (!session || (session.user?.role !== 'SUPER_ADMIN' && session.user?.role !== 'TEAM')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Courses
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
          <p className="mt-2 text-gray-600">
            Update course information and manage course materials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Information Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Information</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    {...register('code')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    {...register('credits', { valueAsNumber: true })}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.credits && (
                    <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <input
                    type="text"
                    {...register('level')}
                    placeholder="e.g., Undergraduate, Graduate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.level && (
                    <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Board/University *
                  </label>
                  <input
                    type="text"
                    {...register('boardOrUniversity')}
                    placeholder="e.g., Cambridge, MIT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.boardOrUniversity && (
                    <p className="mt-1 text-sm text-red-600">{errors.boardOrUniversity.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language *
                </label>
                <input
                  type="text"
                  {...register('language')}
                  placeholder="e.g., English"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.language && (
                  <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active Course
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Course'}
              </button>
            </form>
          </div>

          {/* Material Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Course Material</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Type *
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="SYLLABUS">Syllabus</option>
                  <option value="OLD_PAPER">Old Paper</option>
                  <option value="REFERENCE">Reference Material</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="e.g., Course Syllabus 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the material"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {materialType === 'OLD_PAPER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={materialYear || ''}
                    onChange={(e) => setMaterialYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 2023"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                    >
                      Select PDF File
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Maximum file size: 10MB
                  </p>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={uploadMaterial}
                disabled={uploading || !selectedFile || !materialTitle.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Course Materials</h2>
            <div className="text-sm text-gray-500">
              {sortedMaterials.length} total materials
              {(searchTerm || typeFilter !== 'ALL') && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {materials.length - sortedMaterials.length} filtered out
                </span>
              )}
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search materials by title, description, or type..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="SYLLABUS">Syllabus</option>
                <option value="OLD_PAPER">Old Papers</option>
                <option value="REFERENCE">Reference</option>
              </select>
              
              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="createdAt">Date Created</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
              </select>
              
              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                <ChevronUpDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || typeFilter !== 'ALL') && (
            <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {typeFilter !== 'ALL' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Type: {typeFilter.replace('_', ' ')}
                  <button
                    onClick={() => setTypeFilter('ALL')}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              
              <button
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('ALL')
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Materials List */}
          {paginatedMaterials.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || typeFilter !== 'ALL' ? (
                <div>
                  <p className="text-gray-500 mb-2">No materials match your current filters.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setTypeFilter('ALL')
                    }}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">No materials uploaded yet.</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
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
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            material.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {material.isActive ? (
                              <>
                                <EyeIcon className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {material.title}
                        </h3>
                        
                        {material.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {material.description}
                          </p>
                        )}
                        
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span>
                            Uploaded: {new Date(material.createdAt).toLocaleDateString()}
                          </span>
                          {material.fileUrl && (
                            <a
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800"
                            >
                              View File
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => deleteMaterial(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete material"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(endIndex, sortedMaterials.length)}
                        </span>{' '}
                        of <span className="font-medium">{sortedMaterials.length}</span> results
                      </p>
                    </div>
                    
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
