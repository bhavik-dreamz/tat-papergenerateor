# TAT Paper Generator

An AI-powered student help platform that generates exam papers based on course materials and old paper styles using advanced AI and vector search capabilities.

## Features

- **AI Paper Generation**: Generate exam papers using Groq API with RAG (Retrieval Augmented Generation)
- **PDF Text Extraction**: Extract text from uploaded PDF materials and store in Qdrant vector database
- **Course Management**: Create and manage courses with detailed information
- **Material Upload**: Upload course materials (syllabus, old papers, references) as PDFs
- **Vector Search**: Use Qdrant for semantic search of course materials
- **User Management**: Three user roles - Super Admin, Team, and Student
- **Subscription Plans**: Free, Medium, and Pro tiers with usage limits
- **Payment Integration**: Stripe integration for subscription management
- **AI Grading**: Grade uploaded student papers with AI feedback

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI/ML**: Groq API, OpenAI Embeddings
- **Vector Database**: Qdrant
- **Payments**: Stripe
- **File Processing**: pdf-parse, mammoth

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Qdrant vector database (local or cloud)
- OpenAI API key (for embeddings)
- Groq API key
- Stripe account

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tat-paper-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/tat_paper_generator"

   # NextAuth
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Groq API
   GROQ_API_KEY="your-groq-api-key"

   # OpenAI (for embeddings)
   OPENAI_API_KEY="your-openai-api-key"

   # Qdrant Vector Database
   QDRANT_URL="http://localhost:6333"
   QDRANT_API_KEY="your-qdrant-api-key"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
   STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

   # File Upload (for local development)
   UPLOAD_DIR="./uploads"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Initialize with sample data
   npm run setup
   ```

5. **Start Qdrant (if running locally)**
   ```bash
   # Using Docker
   docker run -p 6333:6333 qdrant/qdrant
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### For Super Admins
- Access admin dashboard at `/admin`
- Create and manage courses
- Upload course materials (PDFs)
- Manage teams and users
- Configure subscription plans
- View platform analytics

### For Team Members
- Access admin dashboard at `/admin`
- Create and manage courses
- Upload course materials
- View assigned students

### For Students
- Browse available courses
- Generate exam papers based on course materials
- Upload completed papers for AI grading
- View grading results and feedback

## Project Structure

```
├── app/
│   ├── admin/                 # Admin dashboard pages
│   ├── api/                   # API routes
│   │   ├── admin/            # Admin API endpoints
│   │   ├── auth/             # Authentication endpoints
│   │   └── papers/           # Paper generation endpoints
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # User dashboard
│   └── papers/               # Paper generation pages
├── components/
│   ├── admin/                # Admin dashboard components
│   └── ui/                   # Reusable UI components
├── lib/                      # Utility libraries
│   ├── groq.ts              # Groq API integration
│   ├── qdrant.ts            # Qdrant vector database
│   ├── prisma.ts            # Prisma client
│   └── stripe.ts            # Stripe integration
├── prisma/                   # Database schema and migrations
├── scripts/                  # Setup and utility scripts
└── types/                    # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get current session

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/courses` - List all courses
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/[id]` - Update course
- `DELETE /api/admin/courses/[id]` - Delete course
- `GET /api/admin/materials` - List all materials
- `POST /api/admin/materials/upload` - Upload material with PDF processing
- `GET /api/admin/students` - List all users
- `GET /api/admin/teams` - List all teams

### Papers
- `POST /api/papers/generate` - Generate exam paper
- `POST /api/papers/grade` - Grade uploaded paper

## AI Paper Generation

The system uses a sophisticated RAG (Retrieval Augmented Generation) approach:

1. **Material Upload**: PDFs are uploaded and text is extracted
2. **Vector Storage**: Text content is embedded and stored in Qdrant
3. **Semantic Search**: When generating papers, relevant materials are retrieved
4. **AI Generation**: Groq API generates papers based on retrieved context
5. **Quality Control**: Papers follow specific formatting and style guidelines

### Paper Generation Process

1. User selects course and specifies requirements
2. System searches Qdrant for relevant course materials
3. Retrieved materials are used as context for AI generation
4. Groq API generates paper following specified format
5. Generated paper is saved and made available to user

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts with roles and subscription plans
- **Courses**: Course information and metadata
- **CourseMaterials**: Uploaded materials with extracted text
- **PaperRequests**: Generated paper requests and metadata
- **PaperSubmissions**: Student submissions for grading
- **Teams**: Team management for collaborative features

## Security

- JWT-based authentication with NextAuth.js
- Role-based access control
- Input validation with Zod
- Secure file upload handling
- Environment variable protection

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Ensure PostgreSQL database is accessible
- Set up Qdrant vector database
- Configure environment variables
- Set up file storage (consider cloud storage for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the code comments

## Roadmap

- [ ] Multi-language support
- [ ] Advanced paper templates
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Integration with LMS platforms
