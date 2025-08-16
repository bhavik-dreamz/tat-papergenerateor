import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { gradePaper } from '@/lib/groq'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const paperVariantId = formData.get('paperVariantId') as string
    const file = formData.get('file') as File

    if (!paperVariantId || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get paper variant and marking scheme
    const paperVariant = await prisma.paperVariant.findUnique({
      where: { id: paperVariantId },
      include: {
        paperRequest: {
          include: {
            course: true
          }
        }
      }
    })

    if (!paperVariant) {
      return NextResponse.json({ error: 'Paper variant not found' }, { status: 404 })
    }

    // Check if user has access to this paper
    if (paperVariant.paperRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Extract text from uploaded file
    let extractedText = ''
    const buffer = Buffer.from(await file.arrayBuffer())
    
    if (file.type === 'application/pdf') {
      const pdfData = await pdf(buffer)
      extractedText = pdfData.text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Extract answers from text (this is a simplified version - you might want to use more sophisticated parsing)
    const extractedAnswers = extractAnswersFromText(extractedText, paperVariant.paperData)

    // Prepare grading prompt
    const prompt = `Grade the student's answers according to the generated paper with ID ${paperVariantId} and the marking scheme/rubric provided.

Inputs:
- paper_variant_id: ${paperVariantId}
- marking_scheme: ${JSON.stringify(paperVariant.markingScheme)}
- extracted_answers: ${JSON.stringify(extractedAnswers)}
- course_policy: {
  "grading_scale": "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59",
  "pass_threshold": 60,
  "partial_marking": true
}

Ensure:
- All scoring follows the rubric.
- Add constructive strengths & improvement_suggestions.
- Return only JSON per the grading schema.`

    // Grade the paper using Groq
    const gradingResult = await gradePaper(prompt)
    
    if (!gradingResult) {
      return NextResponse.json({ error: 'Failed to grade paper' }, { status: 500 })
    }

    // Parse the grading result
    let gradingData
    try {
      gradingData = JSON.parse(gradingResult)
    } catch (error) {
      console.error('Failed to parse grading result:', error)
      return NextResponse.json({ error: 'Invalid grading format' }, { status: 500 })
    }

    // Check if grading was successful
    if (gradingData.status === 'error') {
      return NextResponse.json({ 
        error: gradingData.error?.message || 'Grading failed',
        code: gradingData.error?.code
      }, { status: 400 })
    }

    // Save file to uploads directory (you might want to use cloud storage in production)
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `./uploads/${fileName}`
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs')
    const path = require('path')
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    fs.writeFileSync(path.join(uploadsDir, fileName), buffer)

    // Create submission record
    const submission = await prisma.paperSubmission.create({
      data: {
        userId: session.user.id,
        paperVariantId,
        submittedFile: filePath,
        extractedAnswers,
        status: 'SUBMITTED',
      }
    })

    // Create grading result
    const grading = await prisma.gradingResult.create({
      data: {
        submissionId: submission.id,
        totalScore: gradingData.total_score,
        maxScore: gradingData.max_score,
        percentage: gradingData.percentage,
        grade: gradingData.grade,
        marksBreakdown: gradingData.marks_breakdown,
        feedback: gradingData.feedback,
        autoGraded: true,
      }
    })

    // Update submission status
    await prisma.paperSubmission.update({
      where: { id: submission.id },
      data: { 
        status: 'GRADED',
        gradedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      submission,
      grading,
      gradingData
    })

  } catch (error) {
    console.error('Error grading paper:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to extract answers from text
function extractAnswersFromText(text: string, paperData: any): any[] {
  const answers: any[] = []
  
  // This is a simplified extraction - you might want to use more sophisticated parsing
  // based on your paper format and question structure
  
  if (paperData.sections) {
    paperData.sections.forEach((section: any) => {
      if (section.questions) {
        section.questions.forEach((question: any) => {
          // Look for answer patterns in the text
          const questionId = question.id
          const answerPattern = new RegExp(`${questionId}[\\s\\n]*[:\\-]?[\\s\\n]*(.+?)(?=\\n[A-Z]\\d|$)`, 'i')
          const match = text.match(answerPattern)
          
          if (match) {
            answers.push({
              question_id: questionId,
              answer_text: match[1].trim()
            })
          } else {
            // If no specific pattern found, try to find any text after the question ID
            answers.push({
              question_id: questionId,
              answer_text: 'No answer found'
            })
          }
        })
      }
    })
  }
  
  return answers
}
