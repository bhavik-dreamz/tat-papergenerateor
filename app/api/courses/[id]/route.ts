import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // Find the course
    const course = await prisma.course.findUnique({
      where: { 
        id: params.id,
        isActive: true // Only show active courses in public view
      },
      include: {
        _count: {
          select: {
            materials: {
              where: { isActive: true }
            },
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Return course details
    return NextResponse.json({
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits,
      level: course.level,
      boardOrUniversity: course.boardOrUniversity,
      language: course.language,
      isActive: course.isActive,
      createdAt: course.createdAt,
      _count: course._count
    })

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
