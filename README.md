# TAT Paper Generator

An AI-powered exam paper generation platform that creates high-quality, course-specific exam papers using advanced language models and automated grading.

## 🚀 Features

### Core Features
- **AI Paper Generation**: Generate exam papers using Groq API with course-specific materials
- **Smart Grading**: Automatically grade submitted papers with detailed feedback
- **RAG System**: Retrieval Augmented Generation using Pinecone for course materials
- **Multiple User Roles**: Super Admin, Team Member, and Student roles
- **Subscription Plans**: Free, Medium, and Pro plans with different limits
- **Course Management**: Upload course materials, syllabi, and past papers
- **Paper Variants**: Generate multiple variants of the same paper
- **Real-time Analytics**: Track performance and usage statistics

### Technical Features
- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Type-safe development
- **Prisma ORM**: Database management with PostgreSQL
- **NextAuth.js**: Authentication and session management
- **Stripe Integration**: Payment processing and subscription management
- **Tailwind CSS**: Modern, responsive UI design
- **Pinecone**: Vector database for RAG system
- **Groq API**: Ultra-fast AI inference for paper generation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI/ML**: Groq API, Pinecone Vector Database
- **Payments**: Stripe
- **File Processing**: PDF parsing, DOCX processing
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Groq API key
- Pinecone API key
- Stripe account and API keys

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tat-paper-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tat_paper_generator"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Groq API
GROQ_API_KEY="your-groq-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# Pinecone
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="gcp-starter"
PINECONE_INDEX_NAME="tat-paper-generator"

# File Upload
UPLOAD_DIR="./uploads"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 Usage Guide

### For Students

1. **Sign Up/Login**: Create an account or sign in
2. **Browse Courses**: View available courses and enroll
3. **Generate Papers**: Select course, topics, and specifications
4. **Submit for Grading**: Upload completed papers (PDF/DOC)
5. **View Results**: Get detailed feedback and scores

### For Teachers/Team Members

1. **Create Courses**: Add new courses with materials
2. **Upload Content**: Add syllabi, past papers, and notes
3. **Generate Papers**: Create exam papers for students
4. **Review Submissions**: Monitor student submissions and grades

### For Super Admins

1. **User Management**: Manage all users and roles
2. **Course Oversight**: Monitor all courses and materials
3. **Analytics**: View platform-wide statistics
4. **System Configuration**: Configure plans and features

## 🏗️ Project Structure

```
tat-paper-generator/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── papers/            # Paper management
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── groq.ts           # AI API client
│   ├── pinecone.ts       # Vector database
│   └── stripe.ts         # Payment processing
├── prisma/               # Database schema
├── uploads/              # File uploads
└── public/               # Static assets
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Papers
- `POST /api/papers/generate` - Generate new paper
- `POST /api/papers/grade` - Grade submitted paper
- `GET /api/papers` - List user's papers

### Courses
- `GET /api/courses` - List available courses
- `POST /api/courses` - Create new course
- `GET /api/courses/[id]` - Get course details

### Dashboard
- `GET /api/dashboard/stats` - User statistics

## 🎯 AI Paper Generation

The system uses a sophisticated prompt engineering approach:

1. **Context Retrieval**: Search course materials using Pinecone RAG
2. **Style Analysis**: Analyze historical paper styles and patterns
3. **Content Generation**: Use Groq API to generate questions
4. **Quality Control**: Ensure originality and academic standards
5. **Formatting**: Structure papers according to course requirements

### Paper Generation Prompt

The system uses a comprehensive prompt that includes:
- Course specifications and requirements
- Historical paper styles and patterns
- Topic coverage and difficulty distribution
- Academic integrity guidelines
- Output formatting requirements

## 📊 Database Schema

### Core Tables
- `users` - User accounts and roles
- `courses` - Course information
- `course_materials` - Uploaded materials
- `paper_requests` - Paper generation requests
- `paper_variants` - Generated paper variants
- `paper_submissions` - Student submissions
- `grading_results` - Grading outcomes
- `plans` - Subscription plans
- `stripe_subscriptions` - Payment subscriptions

## 🔒 Security Features

- **Authentication**: Secure session management with NextAuth.js
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted passwords and sensitive data
- **API Security**: Protected API routes with session validation
- **File Upload**: Secure file handling and validation

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Integration with LMS platforms
- [ ] Multi-language support
- [ ] Advanced plagiarism detection
- [ ] Real-time collaboration features
- [ ] API for third-party integrations

## 🙏 Acknowledgments

- Groq for ultra-fast AI inference
- Pinecone for vector database services
- Stripe for payment processing
- Next.js team for the amazing framework
- The open-source community for various libraries and tools
