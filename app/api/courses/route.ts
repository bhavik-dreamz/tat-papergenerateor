import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get courses based on user role
    let courses
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all courses
      courses = await prisma.course.findMany({
        where: { isActive: true },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (session.user.role === 'TEAM') {
      // Team members can see courses they created or are enrolled in
      courses = await prisma.course.findMany({
        where: {
          OR: [
            { createdById: session.user.id },
            {
              enrollments: {
                some: {
                  userId: session.user.id
                }
              }
            }
          ],
          isActive: true
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Students can only see courses they're enrolled in
      courses = await prisma.course.findMany({
        where: {
          enrollments: {
            some: {
              userId: session.user.id
            }
          },
          isActive: true
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({
      courses: courses.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        level: course.level,
        boardOrUniversity: course.boardOrUniversity,
        language: course.language,
        createdBy: course.createdBy.name,
        createdAt: course.createdAt,
      }))
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins and team members can create courses
    if (session.user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, description, level, boardOrUniversity, language } = await request.json()

    // Validate input
    if (!name || !description || !level || !boardOrUniversity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate a unique course code
    const courseCode = `${name.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(-4)}`

    // Create course
    const course = await prisma.course.create({
      data: {
        name,
        description,
        code: courseCode,
        credits: 3, // Default credits
        level,
        boardOrUniversity,
        language: language || 'English',
        createdById: session.user.id,
      }
    })

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        name: course.name,
        description: course.description,
        level: course.level,
        boardOrUniversity: course.boardOrUniversity,
        language: course.language,
        createdAt: course.createdAt,
      }
    })

  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
