'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, DocumentIcon, EyeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Course {
  id: string
  name: string
  code: string
}

interface Material {
  id: string
  title: string
  description: string
  type: string
  fileUrl: string
  fileSize: number
  createdAt: string
  course: {
    name: string
    code: string
  }
  uploadedBy: {
    name: string
    email: string
  }
}

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SYLLABUS',
    courseId: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchMaterials()
    fetchCourses()
  }, [])

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/admin/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to fetch materials')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, DOCX, and TXT files are allowed')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile && !editingMaterial) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    
    try {
      let fileUrl = editingMaterial?.fileUrl || ''

      // Upload file if it's a new material or file has changed
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', formData.title)
        formData.append('description', formData.description)
        formData.append('type', formData.type)
        formData.append('courseId', formData.courseId)

        const uploadResponse = await fetch('/api/admin/materials/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || 'Failed to upload file')
        }

        const uploadResult = await uploadResponse.json()
        fileUrl = uploadResult.fileUrl
      }

      // Save material data
      const url = editingMaterial 
        ? `/api/admin/materials/${editingMaterial.id}`
        : '/api/admin/materials'
      
      const method = editingMaterial ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fileUrl,
          fileSize: selectedFile?.size || editingMaterial?.fileSize || 0
        }),
      })

      if (response.ok) {
        toast.success(editingMaterial ? 'Material updated successfully' : 'Material uploaded successfully')
        setShowForm(false)
        setEditingMaterial(null)
        resetForm()
        fetchMaterials()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save material')
      }
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Failed to save material')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      courseId: material.course.id
    })
    setShowForm(true)
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Material deleted successfully')
        fetchMaterials()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete material')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Failed to delete material')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'SYLLABUS',
      courseId: ''
    })
    setSelectedFile(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingMaterial(null)
    resetForm()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMaterialTypeColor = (type: string) => {
    switch (type) {
      case 'SYLLABUS':
        return 'bg-blue-100 text-blue-800'
      case 'OLD_PAPER':
        return 'bg-green-100 text-green-800'
      case 'REFERENCE':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Material Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage course materials and old paper formats
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Material
        </button>
      </div>

      {/* Material Upload Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingMaterial ? 'Edit Material' : 'Upload New Material'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Material Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">
                  Course
                </label>
                <select
                  id="courseId"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Material Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              >
                <option value="SYLLABUS">Syllabus</option>
                <option value="OLD_PAPER">Old Paper Format</option>
                <option value="REFERENCE">Reference Material</option>
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                File
              </label>
              <input
                type="file"
                id="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                required={!editingMaterial}
              />
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, DOCX, TXT (Max size: 10MB)
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : (editingMaterial ? 'Update Material' : 'Upload Material')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {materials.map((material) => (
            <li key={material.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{material.title}</p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMaterialTypeColor(material.type)}`}>
                          {material.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{material.description}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{material.course.code} - {material.course.name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatFileSize(material.fileSize)}</span>
                        <span className="mx-2">•</span>
                        <span>Uploaded by {material.uploadedBy.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => handleEdit(material)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {materials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No materials found. Upload your first material to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
