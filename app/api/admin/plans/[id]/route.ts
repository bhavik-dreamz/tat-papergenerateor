import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

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
    const { 
      name, 
      description, 
      tier, 
      price, 
      currency, 
      maxPapersPerMonth, 
      maxVariants, 
      includeAnswers, 
      features, 
      isActive 
    } = body

    // Validate required fields
    if (!name || !description || !tier || price === undefined || !maxPapersPerMonth || !maxVariants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate tier
    const validTiers = ['FREE', 'MEDIUM', 'PRO']
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be FREE, MEDIUM, or PRO' },
        { status: 400 }
      )
    }

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id }
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        name,
        description,
        tier,
        price: parseFloat(price),
        currency: currency || 'USD',
        maxPapersPerMonth: parseInt(maxPapersPerMonth),
        maxVariants: parseInt(maxVariants),
        includeAnswers: includeAnswers || false,
        features: features || [],
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error updating plan:', error)
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

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Check if plan has users
    if (existingPlan._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active subscribers' },
        { status: 400 }
      )
    }

    await prisma.plan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
