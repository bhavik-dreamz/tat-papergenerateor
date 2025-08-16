import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current month and year
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Fetch user's paper requests
    const totalPapers = await prisma.paperRequest.count({
      where: { userId: session.user.id }
    })

    // Fetch papers generated this month
    const papersThisMonth = await prisma.paperRequest.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1)
        }
      }
    })

    // Fetch enrolled courses
    const totalCourses = await prisma.courseEnrollment.count({
      where: { userId: session.user.id }
    })

    // Calculate average score from graded submissions
    const gradingResults = await prisma.gradingResult.findMany({
      where: {
        submission: {
          userId: session.user.id
        }
      },
      select: {
        percentage: true
      }
    })

    const averageScore = gradingResults.length > 0
      ? gradingResults.reduce((sum, result) => sum + result.percentage, 0) / gradingResults.length
      : 0

    return NextResponse.json({
      totalPapers,
      totalCourses,
      papersThisMonth,
      averageScore
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
