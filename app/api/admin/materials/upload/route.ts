import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { upsertCourseMaterial, isQdrantEnabled } from '@/lib/qdrant'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const year = formData.get('year') as string

    if (!file || !courseId || !title) {
      return NextResponse.json(
        { error: 'File, courseId, and title are required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type - only PDF for now
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are currently supported' },
        { status: 400 }
      )
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Extract text from PDF
    let extractedText = ''
    try {
      const pdfData = await pdf(buffer)
      extractedText = pdfData.text
      
      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract text from PDF. Please ensure the PDF contains readable text.' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      return NextResponse.json(
        { error: 'Failed to extract text from PDF' },
        { status: 500 }
      )
    }

    // Create material record in database
    const material = await prisma.courseMaterial.create({
      data: {
        courseId,
        title,
        description: description || null,
        type: type as 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE',
        fileUrl: `/uploads/${fileName}`,
        fileSize: file.size,
        content: extractedText,
        year: year ? parseInt(year) : null,
        uploadedById: session.user.id,
      }
    })

    // Store in Qdrant for vector search (only if enabled)
    if (isQdrantEnabled()) {
      try {
        console.log('🔄 Qdrant is enabled, attempting to store material in vector database...')
        await upsertCourseMaterial({
          id: material.id,
          courseId: material.courseId,
          title: material.title,
          description: material.description || undefined,
          type: material.type as 'SYLLABUS' | 'OLD_PAPER' | 'REFERENCE',
          content: material.content || '',
          year: material.year || undefined,
          weightings: material.weightings,
          styleNotes: material.styleNotes || undefined,
        })
        console.log('✅ Successfully stored material in Qdrant vector database');
      } catch (qdrantError) {
        const errorMessage = qdrantError instanceof Error ? qdrantError.message : 'Unknown error';
        console.error('⚠️ Warning: Could not store in Qdrant vector database:', errorMessage);
        console.log('📝 Material saved in main database successfully - vector search will be unavailable for this material');
        // Continue even if Qdrant fails - the material is still saved in the database
      }
    } else {
      console.log('ℹ️ Qdrant is disabled in environment variables - skipping vector database storage')
      console.log('📝 Material saved in main database successfully (vector search not available)')
    }

    return NextResponse.json({ 
      success: true,
      material: {
        id: material.id,
        title: material.title,
        fileUrl: material.fileUrl,
        fileSize: material.fileSize,
        type: material.type,
        contentLength: extractedText.length,
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
