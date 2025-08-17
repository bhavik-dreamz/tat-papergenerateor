'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AcademicCapIcon,
  HomeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">TAT Paper Generator</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <HomeIcon className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link
              href="/courses"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname?.startsWith('/courses') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <AcademicCapIcon className="h-4 w-4" />
              <span>Browse Courses</span>
            </Link>

            {session && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/dashboard' 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {(session.user.role === 'SUPER_ADMIN' || session.user.role === 'TEAM') && (
                  <Link
                    href="/admin"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname?.startsWith('/admin') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  Welcome, {session.user.name}
                </span>
                <Link
                  href="/auth/signout"
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Home
          </Link>
          <Link
            href="/courses"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname?.startsWith('/courses') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Browse Courses
          </Link>
          {session && (
            <>
              <Link
                href="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/dashboard' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              {(session.user.role === 'SUPER_ADMIN' || session.user.role === 'TEAM') && (
                <Link
                  href="/admin"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname?.startsWith('/admin') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
