'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon, 
  AcademicCapIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  UserGroupIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalStudents: number
  totalCourses: number
  totalMaterials: number
  totalTeams: number
  totalPlans: number
  papersGeneratedThisMonth: number
  averageScore: number
  activeSubscriptions: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      name: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      name: 'Total Materials',
      value: stats?.totalMaterials || 0,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      name: 'Total Teams',
      value: stats?.totalTeams || 0,
      icon: UserGroupIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      name: 'Active Plans',
      value: stats?.totalPlans || 0,
      icon: CreditCardIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      name: 'Papers This Month',
      value: stats?.papersGeneratedThisMonth || 0,
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      name: 'Average Score',
      value: `${stats?.averageScore?.toFixed(1) || 0}%`,
      icon: ChartBarIcon,
      color: 'bg-teal-500',
      textColor: 'text-teal-600'
    },
    {
      name: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCardIcon,
      color: 'bg-pink-500',
      textColor: 'text-pink-600'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Key metrics and statistics for your platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className={`text-2xl font-semibold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <p className="text-gray-500 text-sm">
              Recent activity will be displayed here. This could include:
            </p>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>• New student registrations</li>
              <li>• Course uploads</li>
              <li>• Paper generations</li>
              <li>• Material uploads</li>
              <li>• Team creations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
