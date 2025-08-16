#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up TAT Paper Generator...')

  try {
    // Create default plans
    console.log('📋 Creating default subscription plans...')
    
    const plans = [
      {
        tier: 'FREE',
        name: 'Free Plan',
        description: 'Perfect for trying out the platform',
        price: 0,
        maxPapersPerMonth: 1,
        maxVariants: 1,
        includeAnswers: false,
        features: ['Basic paper generation', 'Standard grading', 'Email support']
      },
      {
        tier: 'MEDIUM',
        name: 'Medium Plan',
        description: 'Great for individual teachers',
        price: 19,
        maxPapersPerMonth: 5,
        maxVariants: 3,
        includeAnswers: true,
        features: ['Advanced paper generation', 'Detailed grading with feedback', 'Multiple paper variants', 'Priority support']
      },
      {
        tier: 'PRO',
        name: 'Pro Plan',
        description: 'Perfect for institutions and teams',
        price: 49,
        maxPapersPerMonth: -1, // Unlimited
        maxVariants: 5,
        includeAnswers: true,
        features: ['Unlimited papers', 'Premium AI models', 'Advanced analytics', 'Custom branding', 'API access', 'Dedicated support']
      }
    ]

    for (const planData of plans) {
      const existingPlan = await prisma.plan.findFirst({
        where: { tier: planData.tier }
      })

      if (!existingPlan) {
        await prisma.plan.create({
          data: planData
        })
        console.log(`✅ Created ${planData.name}`)
      } else {
        console.log(`⏭️  ${planData.name} already exists`)
      }
    }

    // Create super admin user
    console.log('👤 Creating super admin user...')
    
    const adminEmail = 'admin@tatpaper.com'
    const adminPassword = 'admin123'
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      })
      
      console.log('✅ Created super admin user')
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
      console.log('⚠️  Please change the password after first login!')
    } else {
      console.log('⏭️  Super admin user already exists')
    }

    // Create sample course
    console.log('📚 Creating sample course...')
    
    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    
    const sampleCourse = await prisma.course.create({
      data: {
        name: 'Introduction to Computer Science',
        description: 'A comprehensive introduction to computer science concepts, programming fundamentals, and problem-solving techniques.',
        code: 'CS101',
        credits: 3,
        level: 'Undergraduate',
        boardOrUniversity: 'Sample University',
        language: 'English',
        createdById: adminUser.id
      }
    })

    console.log('✅ Created sample course:', sampleCourse.name)

    // Create sample course materials
    console.log('📄 Creating sample course materials...')
    
    const sampleMaterials = [
      {
        title: 'Course Syllabus',
        description: 'Complete course syllabus with learning objectives',
        type: 'SYLLABUS',
        content: 'This course covers fundamental computer science concepts including algorithms, data structures, programming paradigms, and software engineering principles. Students will learn to think computationally and solve problems using programming.',
        weightings: { 'algorithms': 30, 'data_structures': 25, 'programming': 35, 'software_engineering': 10 },
        styleNotes: 'Focus on practical applications and hands-on programming exercises.',
        uploadedById: adminUser.id
      },
      {
        title: 'Sample Midterm Paper 2023',
        description: 'Previous year midterm examination paper',
        type: 'OLD_PAPER',
        content: 'Section A: Multiple Choice Questions (20 marks)\n1. What is the time complexity of binary search?\n2. Which data structure uses LIFO principle?\n\nSection B: Short Answer Questions (30 marks)\n3. Explain the concept of recursion with an example.\n4. Differentiate between stack and queue.\n\nSection C: Programming Questions (50 marks)\n5. Write a program to implement binary search.\n6. Create a class for a linked list with basic operations.',
        year: 2023,
        weightings: { 'algorithms': 40, 'data_structures': 35, 'programming': 25 },
        styleNotes: 'Three sections with increasing difficulty. Programming questions require code implementation.',
        uploadedById: adminUser.id
      }
    ]

    for (const materialData of sampleMaterials) {
      await prisma.courseMaterial.create({
        data: {
          ...materialData,
          courseId: sampleCourse.id
        }
      })
    }

    console.log('✅ Created sample course materials')

    console.log('\n🎉 Setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Visit http://localhost:3000')
    console.log('3. Login with admin@tatpaper.com / admin123')
    console.log('4. Change the admin password')
    console.log('5. Configure your API keys in .env.local')
    console.log('6. Start using the platform!')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
