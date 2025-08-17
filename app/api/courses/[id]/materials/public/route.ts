import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Find the course first to ensure it exists and is active
    const course = await prisma.course.findUnique({
      where: { 
        id: params.id,
        isActive: true
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get materials for this course - public endpoint but limited data
    const materials = await prisma.courseMaterial.findMany({
      where: {
        courseId: params.id,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        year: true,
        createdAt: true,
        // Don't include fileUrl or content - keep it secure
      },
      orderBy: [
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Return public material info - no sensitive data
    return NextResponse.json(materials.map((material: any) => ({
      id: material.id,
      title: material.title,
      description: material.description,
      type: material.type,
      year: material.year,
      createdAt: material.createdAt,
      hasFile: true, // We'll show all materials have files to encourage login
      requiresAuth: true, // Flag to indicate authentication needed
    })))

  } catch (error) {
    console.error('Error fetching course materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course materials' },
      { status: 500 }
    )
  }
}
