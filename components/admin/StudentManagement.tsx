'use client'

import { useState, useEffect } from 'react'
import { UserIcon, EyeIcon, PencilIcon, TrashIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  plan: {
    name: string
    tier: string
  } | null
  _count: {
    courses: number
    paperRequests: number
    submissions: number
  }
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [studentDetails, setStudentDetails] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDetails = async (studentId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudentDetails(data)
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
      toast.error('Failed to fetch student details')
    }
  }

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student)
    await fetchStudentDetails(student.id)
    setShowDetails(true)
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Student deleted successfully')
        fetchStudents()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('Failed to delete student')
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || student.role === filterRole
    return matchesSearch && matchesRole
  })

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
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage student accounts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              id="role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="TEAM">Team Members</option>
              <option value="SUPER_ADMIN">Super Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredStudents.map((student) => (
            <li key={student.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                          student.role === 'TEAM' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {student.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{student._count.courses} courses</span>
                        <span className="mx-2">•</span>
                        <span>{student._count.paperRequests} papers</span>
                        <span className="mx-2">•</span>
                        <span>{student._count.submissions} submissions</span>
                        {student.plan && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-primary-600">{student.plan.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(student)}
                      className="text-gray-400 hover:text-gray-500"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {student.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete Student"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || filterRole !== 'all' 
                ? 'No students found matching your criteria.' 
                : 'No students found.'}
            </p>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showDetails && selectedStudent && studentDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Student Details - {selectedStudent.name}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-4">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <p><span className="font-medium">Name:</span> {studentDetails.name}</p>
                  <p><span className="font-medium">Email:</span> {studentDetails.email}</p>
                  <p><span className="font-medium">Role:</span> {studentDetails.role}</p>
                  <p><span className="font-medium">Joined:</span> {new Date(studentDetails.createdAt).toLocaleDateString()}</p>
                  {studentDetails.plan && (
                    <p><span className="font-medium">Plan:</span> {studentDetails.plan.name} ({studentDetails.plan.tier})</p>
                  )}
                </div>
              </div>

              {/* Enrolled Courses */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Enrolled Courses</h4>
                {studentDetails.enrolledCourses && studentDetails.enrolledCourses.length > 0 ? (
                  <div className="bg-gray-50 rounded-md p-3">
                    {studentDetails.enrolledCourses.map((course: any) => (
                      <div key={course.id} className="flex items-center justify-between py-1">
                        <span>{course.course.name}</span>
                        <span className="text-sm text-gray-500">{course.course.code}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No courses enrolled</p>
                )}
              </div>

              {/* Paper Requests */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Paper Requests</h4>
                {studentDetails.paperRequests && studentDetails.paperRequests.length > 0 ? (
                  <div className="bg-gray-50 rounded-md p-3">
                    {studentDetails.paperRequests.slice(0, 5).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between py-1">
                        <span>{request.course.name}</span>
                        <span className="text-sm text-gray-500">{request.status}</span>
                      </div>
                    ))}
                    {studentDetails.paperRequests.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... and {studentDetails.paperRequests.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No paper requests</p>
                )}
              </div>

              {/* Submissions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Submissions</h4>
                {studentDetails.submissions && studentDetails.submissions.length > 0 ? (
                  <div className="bg-gray-50 rounded-md p-3">
                    {studentDetails.submissions.slice(0, 5).map((submission: any) => (
                      <div key={submission.id} className="flex items-center justify-between py-1">
                        <span>{submission.paperVariant.paperRequest.course.name}</span>
                        <span className="text-sm text-gray-500">
                          {submission.grading ? `${submission.grading.percentage}%` : submission.status}
                        </span>
                      </div>
                    ))}
                    {studentDetails.submissions.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... and {studentDetails.submissions.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No submissions</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
