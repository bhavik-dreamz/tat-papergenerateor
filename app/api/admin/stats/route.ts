import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TEAM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current month for papers generated this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch all statistics in parallel
    const [
      totalStudents,
      totalCourses,
      totalMaterials,
      totalTeams,
      totalPlans,
      papersGeneratedThisMonth,
      gradingResults,
      activeSubscriptions
    ] = await Promise.all([
      // Total students (users with STUDENT role)
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),
      
      // Total courses
      prisma.course.count(),
      
      // Total materials
      prisma.courseMaterial.count(),
      
      // Total teams (users with TEAM role)
      prisma.user.count({
        where: { role: 'TEAM' }
      }),
      
      // Total plans
      prisma.plan.count(),
      
      // Papers generated this month
      prisma.paperRequest.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      
      // Grading results for average score calculation
      prisma.gradingResult.findMany({
        select: { percentage: true }
      }),
      
      // Active subscriptions
      prisma.stripeSubscription.count({
        where: {
          status: 'active'
        }
      })
    ])

    // Calculate average score
    const averageScore = gradingResults.length > 0 
      ? gradingResults.reduce((sum, result) => sum + result.percentage, 0) / gradingResults.length
      : 0

    const stats = {
      totalStudents,
      totalCourses,
      totalMaterials,
      totalTeams,
      totalPlans,
      papersGeneratedThisMonth,
      averageScore,
      activeSubscriptions
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
