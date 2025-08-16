'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  UsersIcon, 
  CreditCardIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import CourseManagement from '@/components/admin/CourseManagement'
import MaterialManagement from '@/components/admin/MaterialManagement'
import TeamManagement from '@/components/admin/TeamManagement'
import StudentManagement from '@/components/admin/StudentManagement'
import PlanManagement from '@/components/admin/PlanManagement'
import DashboardStats from '@/components/admin/DashboardStats'

const tabs = [
  { name: 'Dashboard', icon: ChartBarIcon, component: DashboardStats },
  { name: 'Courses', icon: AcademicCapIcon, component: CourseManagement },
  { name: 'Materials', icon: DocumentTextIcon, component: MaterialManagement },
  { name: 'Teams', icon: UserGroupIcon, component: TeamManagement },
  { name: 'Students', icon: UsersIcon, component: StudentManagement },
  { name: 'Plans', icon: CreditCardIcon, component: PlanManagement },
]

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('Dashboard')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
    redirect('/auth/signin')
  }

  const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component || DashboardStats

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {session.user.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {session.user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.name
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
