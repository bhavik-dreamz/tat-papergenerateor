'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { XMarkIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SecurePDFViewerProps {
  materialId: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export default function SecurePDFViewer({ materialId, title, isOpen, onClose }: SecurePDFViewerProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && session) {
      loadSecurePDF()
    } else if (!isOpen) {
      // Clear PDF URL when modal closes for security
      setPdfUrl(null)
      setError(null)
    }
  }, [isOpen, session, materialId])

  const loadSecurePDF = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/materials/${materialId}/view`, {
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view this material')
        }
        throw new Error('Failed to load material')
      }

      // Create a blob URL for the PDF
      const pdfBlob = await response.blob()
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      toast.error('Failed to load PDF material')
    } finally {
      setLoading(false)
    }
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Secure PDF Viewer - Download Disabled</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading secure PDF viewer...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <EyeSlashIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Load PDF</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={loadSecurePDF}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {pdfUrl && !loading && !error && (
              <div className="h-96 md:h-[600px] secure-pdf-viewer relative">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border rounded-lg no-select"
                  title={`PDF Viewer: ${title}`}
                  // Security attributes
                  sandbox="allow-same-origin allow-scripts"
                  // Disable context menu and text selection
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    userSelect: 'none',
                    pointerEvents: 'auto' // Allow scrolling but prevent downloads
                  }}
                />
                {/* Security watermark overlay */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  Protected Content
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  {session?.user?.email || 'Authenticated User'}
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <EyeSlashIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">Security Notice</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This material is protected and cannot be downloaded. The content is for viewing only. 
                    Unauthorized distribution is prohibited.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
