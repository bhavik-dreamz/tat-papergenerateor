import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { deleteCourseMaterial } from '@/lib/qdrant'
import { unlink } from 'fs/promises'
import { join } from 'path'

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
    const { title, description, type, courseId, fileUrl, fileSize } = body

    // Validate required fields
    if (!title || !description || !type || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if material exists
    const existingMaterial = await prisma.courseMaterial.findUnique({
      where: { id: params.id }
    })

    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
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

    const material = await prisma.courseMaterial.update({
      where: { id: params.id },
      data: {
        title,
        description,
        type,
        fileUrl: fileUrl || existingMaterial.fileUrl,
        fileSize: fileSize || existingMaterial.fileSize,
        courseId
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

    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating material:', error)
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

    // Check if material exists
    const existingMaterial = await prisma.courseMaterial.findUnique({
      where: { id: params.id }
    })

    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    // Delete from Qdrant first
    try {
      await deleteCourseMaterial(params.id)
    } catch (qdrantError) {
      console.error('Error deleting from Qdrant:', qdrantError)
      // Continue with database deletion even if Qdrant deletion fails
    }

    // Delete the file from storage if it exists
    if (existingMaterial.fileUrl && existingMaterial.fileUrl.startsWith('/uploads/')) {
      try {
        const uploadDir = process.env.UPLOAD_DIR || './uploads'
        const fileName = existingMaterial.fileUrl.split('/').pop()
        if (fileName) {
          const filePath = join(uploadDir, fileName)
          await unlink(filePath)
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError)
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await prisma.courseMaterial.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
