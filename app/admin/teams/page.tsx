'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Team {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    name: string
    email: string
  }
  _count: {
    members: number
  }
  members: TeamMember[]
}

interface TeamMember {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function SuperAdminTeams() {
  const { data: session, status } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [memberFormData, setMemberFormData] = useState({
    userId: '',
    role: 'MEMBER'
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchTeams()
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

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      toast.error('Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingTeam 
        ? `/api/admin/teams/${editingTeam.id}`
        : '/api/admin/teams'
      
      const method = editingTeam ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingTeam ? 'Team updated successfully' : 'Team created successfully')
        setShowForm(false)
        setEditingTeam(null)
        resetForm()
        fetchTeams()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save team')
      }
    } catch (error) {
      console.error('Error saving team:', error)
      toast.error('Failed to save team')
    }
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      description: team.description
    })
    setShowForm(true)
  }

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Team deleted successfully')
        fetchTeams()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete team')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error('Failed to delete team')
    }
  }

  const handleAddMember = (team: Team) => {
    setSelectedTeamForMember(team)
    setShowMemberForm(true)
  }

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeamForMember) return

    try {
      const response = await fetch(`/api/admin/teams/${selectedTeamForMember.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberFormData),
      })

      if (response.ok) {
        toast.success('Member added successfully')
        setShowMemberForm(false)
        setSelectedTeamForMember(null)
        resetMemberForm()
        fetchTeams()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
    }
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Member removed successfully')
        fetchTeams()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
  }

  const resetMemberForm = () => {
    setMemberFormData({
      userId: '',
      role: 'MEMBER'
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTeam(null)
    resetForm()
  }

  const handleMemberCancel = () => {
    setShowMemberForm(false)
    setSelectedTeamForMember(null)
    resetMemberForm()
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Super Admin - Manage all teams in the platform
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Teams</dt>
                      <dd className="text-lg font-medium text-gray-900">{teams.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teams.reduce((sum, team) => sum + team._count.members, 0)}
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
                    <AcademicCapIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Teams</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teams.filter(team => team.isActive).length}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Members/Team</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teams.length > 0 ? Math.round(teams.reduce((sum, team) => sum + team._count.members, 0) / teams.length) : 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Teams</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor all teams in the platform
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Team
            </button>
          </div>

          {/* Team Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTeam ? 'Edit Team' : 'Create New Team'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Team Name
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
                    {editingTeam ? 'Update Team' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Member Form */}
          {showMemberForm && selectedTeamForMember && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Member to {selectedTeamForMember.name}
              </h3>
              <form onSubmit={handleMemberSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                      User ID
                    </label>
                    <input
                      type="text"
                      id="userId"
                      value={memberFormData.userId}
                      onChange={(e) => setMemberFormData({ ...memberFormData, userId: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      value={memberFormData.role}
                      onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleMemberCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Teams List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {teams.map((team) => (
                <li key={team.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserGroupIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{team.name}</p>
                            {!team.isActive && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{team.description}</p>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span>{team._count.members} members</span>
                            <span className="mx-2">•</span>
                            <span>Created by {team.createdBy.name}</span>
                            <span className="mx-2">•</span>
                            <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="text-gray-400 hover:text-gray-500"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAddMember(team)}
                          className="text-gray-400 hover:text-green-500"
                          title="Add Member"
                        >
                          <UserPlusIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(team)}
                          className="text-gray-400 hover:text-blue-500"
                          title="Edit Team"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Delete Team"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Team Members */}
                    {team.members && team.members.length > 0 && (
                      <div className="mt-4 ml-14">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Members:</h4>
                        <div className="space-y-2">
                          {team.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{member.user.name}</span>
                                <span className="ml-2 text-xs text-gray-500">({member.user.email})</span>
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {member.role}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveMember(team.id, member.id)}
                                className="text-red-400 hover:text-red-600 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {teams.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Team
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
