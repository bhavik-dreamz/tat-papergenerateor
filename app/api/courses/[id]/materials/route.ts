import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
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

    // Get materials for this course
    const materials = await prisma.courseMaterial.findMany({
      where: {
        courseId: params.id,
        isActive: true // Only show active materials in public view
      },
      orderBy: [
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(materials.map((material: any) => ({
      id: material.id,
      title: material.title,
      description: material.description,
      type: material.type,
      fileUrl: material.fileUrl,
      year: material.year,
      isActive: material.isActive,
      createdAt: material.createdAt
    })))

  } catch (error) {
    console.error('Error fetching course materials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
