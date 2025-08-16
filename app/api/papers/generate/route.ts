import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { generatePaper } from '@/lib/groq'
import { searchCourseMaterials } from '@/lib/qdrant'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      courseId,
      examType,
      totalMarks,
      durationMinutes,
      topicsInclude,
      topicsExclude,
      difficultyPref,
      styleOverrides,
      variantCount = 1,
      seed
    } = body

    // Get user and their plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check plan limits
    if (!user.plan) {
      return NextResponse.json({ error: 'No active plan' }, { status: 403 })
    }

    // Check monthly quota
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyPapers = await prisma.paperRequest.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1)
        }
      }
    })

    if (monthlyPapers >= user.plan.maxPapersPerMonth) {
      return NextResponse.json({ 
        error: 'Monthly paper limit exceeded',
        code: 'quota_exhausted'
      }, { status: 403 })
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Search for relevant course materials using RAG
    const searchQuery = `${examType} ${topicsInclude.join(' ')} ${course.name}`
    const ragResults = await searchCourseMaterials(courseId, searchQuery, 12)

    // Prepare context for AI
    const context = ragResults.map(result => ({
      id: result.id,
      type: result.payload.type,
      title: result.payload.title,
      year: result.payload.year,
      weightings: result.payload.weightings,
      style_notes: result.payload.styleNotes,
      excerpt: result.payload.content.substring(0, 500),
      source_uri: result.id,
      relevance_score: result.score
    }))

    // Prepare the prompt for paper generation
    const prompt = `Generate exam paper(s) per the system rules using this input:

course:
- id: ${course.id}
- name: ${course.name}
- level: ${course.level}
- board_or_university: ${course.boardOrUniversity}
- language: ${course.language}

plan:
- tier: ${user.plan.tier.toLowerCase()}
- user_quota_left_this_period: ${user.plan.maxPapersPerMonth - monthlyPapers}
- max_variants: ${user.plan.maxVariants}
- include_answers: ${user.plan.includeAnswers}

request:
- exam_type: ${examType}
- total_marks: ${totalMarks}
- duration_minutes: ${durationMinutes}
- topics_include: ${JSON.stringify(topicsInclude)}
- topics_exclude: ${JSON.stringify(topicsExclude)}
- difficulty_pref: ${difficultyPref ? JSON.stringify(difficultyPref) : 'null'}
- seed: ${seed || 'null'}
- variant_count: ${Math.min(variantCount, user.plan.maxVariants)}
- style_overrides: ${styleOverrides || 'null'}

policy:
- originality_target_pct: 85
- citation_required: true
- language: ${course.language}
- safety_flags: []

context.rag (top_k=12):
${context.map(item => `- id: ${item.id}
  type: ${item.type}
  title: ${item.title}
  year: ${item.year || 'null'}
  weightings: ${item.weightings ? JSON.stringify(item.weightings) : 'null'}
  style_notes: ${item.style_notes || 'null'}
  excerpt: ${item.excerpt}
  source_uri: ${item.source_uri}
  relevance_score: ${item.relevance_score}`).join('\n')}

Respond with exactly one JSON object following the schema.`

    // Generate paper using Groq
    const generatedContent = await generatePaper(prompt)
    
    if (!generatedContent) {
      return NextResponse.json({ error: 'Failed to generate paper' }, { status: 500 })
    }

    // Parse the generated JSON
    let paperData
    try {
      paperData = JSON.parse(generatedContent)
    } catch (error) {
      console.error('Failed to parse generated paper:', error)
      return NextResponse.json({ error: 'Invalid paper format generated' }, { status: 500 })
    }

    // Check if generation was successful
    if (paperData.status === 'error') {
      return NextResponse.json({ 
        error: paperData.error?.message || 'Paper generation failed',
        code: paperData.error?.code
      }, { status: 400 })
    }

    // Create paper request in database
    const paperRequest = await prisma.paperRequest.create({
      data: {
        userId: session.user.id,
        courseId,
        examType,
        totalMarks,
        durationMinutes,
        topicsInclude,
        topicsExclude,
        difficultyPref,
        styleOverrides,
        status: 'GENERATED',
        seed: paperData.meta?.seed || seed,
      }
    })

    // Create paper variants
    const variants = []
    for (let i = 0; i < paperData.paper.length; i++) {
      const variant = paperData.paper[i]
      const paperVariant = await prisma.paperVariant.create({
        data: {
          paperRequestId: paperRequest.id,
          variantId: variant.variant_id,
          paperData: variant,
          markingScheme: paperData.marking_scheme || {},
        }
      })
      variants.push(paperVariant)
    }

    return NextResponse.json({
      success: true,
      paperRequest,
      variants,
      paperData
    })

  } catch (error) {
    console.error('Error generating paper:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
