import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteCourseMaterial, isQdrantEnabled } from '@/lib/qdrant'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Delete from Qdrant first (with improved error handling)
    if (isQdrantEnabled()) {
      try {
        console.log('🔄 Attempting to delete material from Qdrant vector database...')
        await deleteCourseMaterial(params.id)
        console.log('✅ Successfully deleted material from Qdrant')
      } catch (qdrantError) {
        const errorMessage = qdrantError instanceof Error ? qdrantError.message : 'Unknown error'
        console.error('⚠️ Warning: Could not delete from Qdrant vector database:', errorMessage)
        console.log('📝 Continuing with main database deletion...')
        // Continue with database deletion even if Qdrant deletion fails
      }
    } else {
      console.log('ℹ️ Qdrant is disabled - skipping vector database deletion')
    }

    // Delete the file from storage if it exists
    if (existingMaterial.fileUrl && existingMaterial.fileUrl.startsWith('/uploads/')) {
      try {
        const uploadDir = process.env.UPLOAD_DIR || './uploads'
        const fileName = existingMaterial.fileUrl.split('/').pop()
        if (fileName) {
          const filePath = join(uploadDir, fileName)
          
          // Check if file exists before trying to delete
          if (existsSync(filePath)) {
            await unlink(filePath)
            console.log('✅ File deleted successfully:', fileName)
          } else {
            console.log('ℹ️ File not found, may have been deleted already:', fileName)
          }
        }
      } catch (fileError) {
        const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error'
        console.error('⚠️ Warning: Could not delete file:', errorMessage)
        console.log('📝 Continuing with database deletion...')
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database (this should be the last step)
    try {
      await prisma.courseMaterial.delete({
        where: { id: params.id }
      })
      console.log('✅ Material deleted successfully from database')
    } catch (dbError) {
      // This shouldn't happen since we checked existence above, but handle it gracefully
      if ((dbError as any)?.code === 'P2025') {
        console.log('ℹ️ Material was already deleted from database')
        return NextResponse.json({ message: 'Material not found or already deleted' }, { status: 404 })
      }
      throw dbError // Re-throw other database errors
    }

    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting material:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
