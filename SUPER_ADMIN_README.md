# Super Admin Management System

This document outlines the comprehensive super admin management system for the TAT Paper Generator platform.

## Overview

The super admin system provides complete administrative control over the platform, including user management, course management, team management, and detailed analytics.

## Super Admin Pages

### 1. Dashboard (`/admin/dashboard`)
- **Purpose**: Overview of platform statistics and quick access to management functions
- **Features**:
  - Real-time platform statistics
  - System health monitoring
  - Quick action buttons for common tasks
  - Recent activity feed
  - Revenue tracking
  - User engagement metrics

### 2. Course Management (`/admin/courses`)
- **Purpose**: Complete course lifecycle management
- **Features**:
  - Create, edit, and delete courses
  - View course statistics (enrollments, materials, requests)
  - Course status management (active/inactive)
  - Detailed course information (credits, level, language, board/university)
  - Bulk operations support

### 3. Student Management (`/admin/students`)
- **Purpose**: Comprehensive user account management
- **Features**:
  - Create, edit, and delete user accounts
  - Role management (Student, Team Member, Super Admin)
  - Password management
  - User activity tracking
  - Subscription status monitoring
  - Bulk user operations

### 4. Team Management (`/admin/teams`)
- **Purpose**: Team creation and member management
- **Features**:
  - Create and manage teams
  - Add/remove team members
  - Role assignment within teams (Admin, Member)
  - Team activity monitoring
  - Team statistics and analytics

### 5. User Profiles (`/admin/profiles`)
- **Purpose**: Detailed user profile viewing and management
- **Features**:
  - Comprehensive user profiles
  - Activity statistics
  - Subscription details
  - Course enrollments
  - Team memberships
  - Search and filter functionality

### 6. Analytics (`/admin/analytics`)
- **Purpose**: Comprehensive platform analytics and performance insights
- **Features**:
  - Real-time platform statistics overview
  - User growth trends and analytics
  - Revenue tracking and financial insights
  - Course performance metrics
  - Team performance analytics
  - System health monitoring
  - Recent activity tracking
  - Customizable time period filtering (7d, 30d, 90d, 1y)

### 7. Settings (`/admin/settings`)
- **Purpose**: Platform configuration and system preferences management
- **Features**:
  - General settings (site name, contact info, timezone)
  - Security settings (password policies, 2FA, session management)
  - Notification preferences (email, SMS, admin alerts)
  - Integration settings (Stripe, Groq AI, Pinecone)
  - System settings (maintenance mode, debug mode, logging)
  - Secure API key management with show/hide functionality
  - Tabbed interface for organized configuration

## Navigation

The super admin system includes a dedicated navigation component (`SuperAdminNav`) that provides:
- Responsive navigation menu
- Active page highlighting
- Mobile-friendly design
- Quick access to all super admin functions

## Security Features

### Authentication
- Session-based authentication using NextAuth.js
- Role-based access control (RBAC)
- Automatic redirect for unauthorized access
- Secure API endpoints

### Authorization
- Super admin role verification on all pages
- API route protection
- Database-level security

## API Endpoints

### Course Management
- `GET /api/admin/courses` - Fetch all courses
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/[id]` - Update course
- `DELETE /api/admin/courses/[id]` - Delete course

### Student Management
- `GET /api/admin/students` - Fetch all students
- `POST /api/admin/students` - Create new student
- `PUT /api/admin/students/[id]` - Update student
- `DELETE /api/admin/students/[id]` - Delete student

### Team Management
- `GET /api/admin/teams` - Fetch all teams
- `POST /api/admin/teams` - Create new team
- `PUT /api/admin/teams/[id]` - Update team
- `DELETE /api/admin/teams/[id]` - Delete team
- `POST /api/admin/teams/[id]/members` - Add team member
- `DELETE /api/admin/teams/[id]/members/[memberId]` - Remove team member

### Statistics
- `GET /api/admin/stats` - Fetch dashboard statistics

### Analytics
- `GET /api/admin/analytics` - Fetch comprehensive analytics data
- Query parameters: `period` (7d, 30d, 90d, 1y)

### Settings
- `GET /api/admin/settings` - Fetch platform settings
- `PUT /api/admin/settings` - Update platform settings
- Body: `{ section: string, data: object }`

## Database Schema

The super admin system leverages the existing Prisma schema with the following key models:

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  planId            String?
  courses           CourseEnrollment[]
  paperRequests     PaperRequest[]
  submissions       PaperSubmission[]
  createdCourses    Course[]
  uploadedMaterials CourseMaterial[]
  createdTeams      Team[]
  teamMemberships   TeamMember[]
  plan              Plan?
}
```

### Course Model
```prisma
model Course {
  id                String   @id @default(cuid())
  name              String
  description       String
  code              String   @unique
  credits           Int      @default(3)
  level             String
  boardOrUniversity String
  language          String   @default("English")
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdById       String
  
  // Relations
  createdBy     User
  enrollments   CourseEnrollment[]
  materials     CourseMaterial[]
  paperRequests PaperRequest[]
}
```

### Team Model
```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  
  // Relations
  createdBy User
  members   TeamMember[]
}
```

## Usage Instructions

### Accessing Super Admin
1. Log in with a super admin account
2. Navigate to `/admin` to access the main admin panel
3. Use the quick access links for super admin specific functions
4. Or navigate directly to specific super admin pages

### Creating a Course
1. Go to `/admin/courses`
2. Click "Add Course"
3. Fill in the required information:
   - Course Name
   - Course Code
   - Description
   - Credits
   - Level (Undergraduate, Graduate, High School, Middle School)
   - Board/University
   - Language
4. Click "Create Course"

### Managing Students
1. Go to `/admin/students`
2. Click "Add Student"
3. Fill in the required information:
   - Full Name
   - Email Address
   - Role (Student, Team Member, Super Admin)
   - Password
4. Click "Create Student"

### Managing Teams
1. Go to `/admin/teams`
2. Click "Create Team"
3. Fill in team information:
   - Team Name
   - Description
4. Add members using the "Add Member" button
5. Assign roles to team members

## Styling and UI

The super admin system uses:
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **React Hot Toast** for notifications
- **Responsive design** for mobile compatibility
- **Consistent color scheme** with primary colors

## Error Handling

- Form validation with user-friendly error messages
- API error handling with toast notifications
- Loading states for better UX
- Confirmation dialogs for destructive actions

## Performance Considerations

- Lazy loading of components
- Efficient database queries with Prisma
- Optimized re-renders with React hooks
- Pagination for large datasets (future enhancement)

## Future Enhancements

1. **Advanced Analytics**
   - Detailed reporting and analytics
   - Export functionality
   - Custom date range filtering

2. **Bulk Operations**
   - Bulk user import/export
   - Bulk course management
   - Batch operations for teams

3. **Audit Logging**
   - Complete audit trail of admin actions
   - User activity tracking
   - System change logging

4. **Advanced Search**
   - Full-text search across all entities
   - Advanced filtering options
   - Saved search queries

5. **Notification System**
   - Real-time notifications
   - Email alerts for important events
   - Custom notification preferences

## Support

For technical support or questions about the super admin system, please refer to the main project documentation or contact the development team.
