import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { deleteCourseMaterials } from '@/lib/qdrant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            materials: true,
            enrollments: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, code, credits, level, boardOrUniversity, language, isActive } = body

    // Validate required fields
    if (!name || !description || !code || !credits || !level || !boardOrUniversity || !language) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if code is unique (excluding current course)
    const existingCourse = await prisma.course.findFirst({
      where: {
        code,
        id: { not: params.id }
      }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      )
    }

    const updatedCourse = await prisma.course.update({
      where: { id: params.id },
      data: {
        name,
        description,
        code,
        credits: parseInt(credits),
        level,
        boardOrUniversity,
        language,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if course has materials or enrollments
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            materials: true,
            enrollments: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course._count.materials > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with materials. Please delete materials first.' },
        { status: 400 }
      )
    }

    if (course._count.enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with enrolled students. Please remove enrollments first.' },
        { status: 400 }
      )
    }

    // Delete all materials from Qdrant first
    try {
      await deleteCourseMaterials(params.id)
    } catch (qdrantError) {
      console.error('Error deleting course materials from Qdrant:', qdrantError)
      // Continue with course deletion even if Qdrant cleanup fails
    }

    // Delete the course (this will cascade delete materials due to foreign key constraint)
    await prisma.course.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
