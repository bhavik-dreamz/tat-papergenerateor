import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        plan: {
          select: {
            name: true,
            tier: true
          }
        },
        courses: {
          include: {
            course: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        paperRequests: {
          include: {
            course: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        submissions: {
          include: {
            paperVariant: {
              include: {
                paperRequest: {
                  include: {
                    course: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            },
            grading: {
              select: {
                percentage: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student details:', error)
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

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of super admins
    if (student.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      )
    }

    // Check if student has any data that would be lost
    const studentData = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            courses: true,
            paperRequests: true,
            submissions: true
          }
        }
      }
    })

    if (studentData && (
      studentData._count.courses > 0 ||
      studentData._count.paperRequests > 0 ||
      studentData._count.submissions > 0
    )) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing data. Please delete their courses, papers, and submissions first.' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
