import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const materials = await prisma.courseMaterial.findMany({
      include: {
        course: {
          select: {
            name: true,
            code: true
          }
        },
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, type, courseId, fileUrl, fileSize } = body

    // Validate required fields
    if (!title || !description || !type || !courseId || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const material = await prisma.courseMaterial.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        fileSize: fileSize || 0,
        courseId,
        uploadedById: session.user.id
      },
      include: {
        course: {
          select: {
            name: true,
            code: true
          }
        },
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
