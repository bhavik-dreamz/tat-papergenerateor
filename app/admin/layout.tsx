'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SuperAdminNav from '@/components/admin/SuperAdminNav'
import { Toaster } from 'react-hot-toast'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminNav />
      <main>{children}</main>
      <Toaster position="top-right" />
    </div>
  )
}
