import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await getServerSession()
    
    // Require authentication to view materials
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Find the material
    const material = await prisma.courseMaterial.findUnique({
      where: {
        id: params.materialId,
        isActive: true
      },
      include: {
        course: {
          select: {
            isActive: true
          }
        }
      }
    })

    if (!material || !material.course.isActive) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    if (!material.fileUrl) {
      return NextResponse.json({ error: 'No file available' }, { status: 404 })
    }

    // Extract filename from URL and construct file path
    const fileName = material.fileUrl.split('/').pop()
    if (!fileName) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), 'uploads', fileName)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Return PDF with security headers to prevent downloading
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // Prevent caching
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        // Display inline instead of attachment to prevent download dialog
        'Content-Disposition': `inline; filename="${material.title}.pdf"`,
        // Custom headers to identify this as a secure view
        'X-Secure-View': 'true',
        // Prevent right-click download in some browsers
        'X-Download-Options': 'noopen',
      },
    })

  } catch (error) {
    console.error('Error serving secure PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
