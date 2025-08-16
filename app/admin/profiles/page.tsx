'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  UserCircleIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
  plan?: {
    id: string
    name: string
    tier: string
    price: number
    currency: string
  }
  subscription?: {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }
  _count: {
    courses: number
    paperRequests: number
    submissions: number
    createdTeams: number
    teamMemberships: number
    createdCourses: number
    uploadedMaterials: number
  }
  courses: CourseEnrollment[]
  teams: TeamMembership[]
  createdCourses: Course[]
}

interface CourseEnrollment {
  id: string
  enrolledAt: string
  course: {
    id: string
    name: string
    code: string
  }
}

interface TeamMembership {
  id: string
  role: string
  joinedAt: string
  team: {
    id: string
    name: string
    description: string
  }
}

interface Course {
  id: string
  name: string
  code: string
  description: string
  isActive: boolean
}

export default function SuperAdminProfiles() {
  const { data: session, status } = useSession()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchProfiles()
    }
  }, [status, session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/auth/signin')
  }

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
      toast.error('Failed to fetch profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = (profile: UserProfile) => {
    setSelectedProfile(profile)
    setShowProfileModal(true)
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || profile.role === roleFilter
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Profile Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Super Admin - View and manage user profiles
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                SUPER ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{profiles.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Students</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profiles.filter(p => p.role === 'STUDENT').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profiles.filter(p => p.role === 'TEAM').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCardIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Premium Users</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profiles.filter(p => p.plan && p.plan.tier !== 'FREE').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Subscriptions</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {profiles.filter(p => p.subscription && p.subscription.status === 'active').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search Users
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Filter by Role
                </label>
                <select
                  id="role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="TEAM">Team Members</option>
                  <option value="SUPER_ADMIN">Super Admins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Profiles List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredProfiles.map((profile) => (
                <li key={profile.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {profile.role}
                            </span>
                            {profile.plan && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {profile.plan.tier}
                              </span>
                            )}
                            {profile.subscription && profile.subscription.status === 'active' && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{profile.email}</p>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span>{profile._count.courses} courses</span>
                            <span className="mx-2">•</span>
                            <span>{profile._count.paperRequests} requests</span>
                            <span className="mx-2">•</span>
                            <span>{profile._count.submissions} submissions</span>
                            <span className="mx-2">•</span>
                            <span>{profile._count.teamMemberships} teams</span>
                            <span className="mx-2">•</span>
                            <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewProfile(profile)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {filteredProfiles.length === 0 && (
              <div className="text-center py-12">
                <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || roleFilter !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No users have been added yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900">{selectedProfile.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{selectedProfile.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Role</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {selectedProfile.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Member Since</label>
                      <p className="text-sm text-gray-900">{new Date(selectedProfile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                {selectedProfile.plan && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Subscription Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Plan</label>
                        <p className="text-sm text-gray-900">{selectedProfile.plan.name} ({selectedProfile.plan.tier})</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Price</label>
                        <p className="text-sm text-gray-900">{selectedProfile.plan.currency} {selectedProfile.plan.price}</p>
                      </div>
                      {selectedProfile.subscription && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Status</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedProfile.subscription.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedProfile.subscription.status}
                            </span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Next Billing</label>
                            <p className="text-sm text-gray-900">
                              {new Date(selectedProfile.subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{selectedProfile._count.courses}</p>
                      <p className="text-xs text-gray-500">Enrolled Courses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{selectedProfile._count.paperRequests}</p>
                      <p className="text-xs text-gray-500">Paper Requests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{selectedProfile._count.submissions}</p>
                      <p className="text-xs text-gray-500">Submissions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{selectedProfile._count.teamMemberships}</p>
                      <p className="text-xs text-gray-500">Team Memberships</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {selectedProfile.courses && selectedProfile.courses.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Course Enrollments</h4>
                    <div className="space-y-2">
                      {selectedProfile.courses.slice(0, 3).map((enrollment) => (
                        <div key={enrollment.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-900">{enrollment.course.name}</span>
                          <span className="text-gray-500">{new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
