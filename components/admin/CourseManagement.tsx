'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Course {
  id: string
  name: string
  description: string
  code: string
  credits: number
  createdAt: string
  updatedAt: string
  createdBy: {
    name: string
    email: string
  }
  _count: {
    materials: number
    enrollments: number
  }
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    credits: 3
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses'
      
      const method = editingCourse ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingCourse ? 'Course updated successfully' : 'Course created successfully')
        setShowForm(false)
        setEditingCourse(null)
        resetForm()
        fetchCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save course')
      }
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course')
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits
    })
    setShowForm(true)
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Course deleted successfully')
        fetchCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      credits: 3
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCourse(null)
    resetForm()
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
          <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage courses for your platform
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Course
        </button>
      </div>

      {/* Course Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Course Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Course Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
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
              <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                Credits
              </label>
              <input
                type="number"
                id="credits"
                min="1"
                max="12"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {courses.map((course) => (
            <li key={course.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {course.code.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{course.name}</p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {course.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{course.description}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{course.credits} credits</span>
                        <span className="mx-2">•</span>
                        <span>{course._count.materials} materials</span>
                        <span className="mx-2">•</span>
                        <span>{course._count.enrollments} students</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="text-gray-400 hover:text-gray-500"
                      title="Edit course"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
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
        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No courses found. Create your first course to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
