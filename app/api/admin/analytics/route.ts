import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get overview statistics
    const [
      totalUsers,
      totalCourses,
      totalTeams,
      totalSubscriptions,
      totalPaperRequests,
      totalSubmissions,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.team.count(),
      prisma.stripeSubscription.count({ where: { status: 'active' } }),
      prisma.paperRequest.count(),
      prisma.paperSubmission.count(),
      prisma.stripeSubscription.aggregate({
        where: { status: 'active' },
        _sum: { amount: true }
      })
    ])

    // Get user growth data
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get course statistics
    const courseStats = await prisma.course.findMany({
      include: {
        enrollments: true,
        materials: true
      }
    })

    // Get team statistics
    const teamStats = await prisma.team.findMany({
      include: {
        members: true
      }
    })

    // Get revenue data
    const revenueData = await prisma.stripeSubscription.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'active'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get recent activity
    const recentActivity = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    // Mock system health data
    const systemHealth = [
      {
        status: 'healthy' as const,
        message: 'Database connection stable',
        timestamp: new Date().toISOString()
      },
      {
        status: 'healthy' as const,
        message: 'API endpoints responding normally',
        timestamp: new Date().toISOString()
      },
      {
        status: 'warning' as const,
        message: 'High memory usage detected',
        timestamp: new Date().toISOString()
      }
    ]

    // Format the data
    const formattedUserGrowth = userGrowth.map((item: any) => ({
      date: item.createdAt.toISOString().split('T')[0],
      newUsers: item._count.id,
      activeUsers: Math.floor(item._count.id * 0.8) // Mock active users
    }))

    const formattedCourseStats = courseStats.map((course: any) => ({
      courseId: course.id,
      courseName: course.name,
      enrollments: course.enrollments.length,
      completionRate: Math.random() * 0.3 + 0.7, // Mock completion rate
      avgGrade: Math.random() * 20 + 70 // Mock average grade
    }))

    const formattedTeamStats = teamStats.map((team: any) => ({
      teamId: team.id,
      teamName: team.name,
      memberCount: team.members.length,
      activeProjects: Math.floor(Math.random() * 5) + 1, // Mock active projects
      avgPerformance: Math.random() * 0.4 + 0.6 // Mock performance
    }))

    const formattedRevenueData = revenueData.map((item: any) => ({
      date: item.createdAt.toISOString().split('T')[0],
      revenue: item._sum.amount || 0,
      subscriptions: item._count.id
    }))

    const formattedRecentActivity = recentActivity.map((user: any) => ({
      id: user.id,
      type: 'user_registration',
      description: `New user ${user.name} registered`,
      timestamp: user.createdAt.toISOString(),
      userId: user.id,
      userName: user.name || 'Unknown'
    }))

    const analyticsData = {
      overview: {
        totalUsers,
        totalCourses,
        totalTeams,
        totalSubscriptions,
        totalPaperRequests,
        totalSubmissions,
        totalRevenue: totalRevenue._sum.amount || 0
      },
      userGrowth: formattedUserGrowth,
      courseStats: formattedCourseStats,
      teamStats: formattedTeamStats,
      revenueData: formattedRevenueData,
      recentActivity: formattedRecentActivity,
      systemHealth
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
