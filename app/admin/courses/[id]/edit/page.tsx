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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Materials</h2>
          
          {materials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No materials uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        material.type === 'SYLLABUS' ? 'bg-blue-100 text-blue-800' :
                        material.type === 'OLD_PAPER' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {material.type}
                      </span>
                      {material.year && (
                        <span className="text-sm text-gray-500">({material.year})</span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-1">
                      {material.title}
                    </h3>
                    {material.description && (
                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Uploaded: {new Date(material.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => deleteMaterial(material.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete material"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
