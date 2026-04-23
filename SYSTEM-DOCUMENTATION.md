# MalawiEduHub - Complete System Documentation

## 📚 Project Overview

**MalawiEduHub** is an educational platform designed for Malawi students to access learning materials, past papers, textbooks, and interactive lessons. The platform provides a comprehensive learning experience with document management, structured learning rooms, quizzes, and subscription-based access.

---

## 🏗️ System Architecture

### Tech Stack

**Frontend:**
- Next.js 13+ (App Router)
- React 18
- TailwindCSS for styling
- Axios for API calls
- Lucide React for icons
- React Hot Toast for notifications

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- Supabase Storage for file uploads
- JWT authentication
- Multer for file uploads

**Deployment:**
- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL (Render/Supabase)
- Storage: Supabase Storage

---

## 🎯 Core Features

### 1. **User Management & Authentication**

#### Implemented:
- ✅ User registration (email/password)
- ✅ User login with JWT tokens
- ✅ Password reset functionality
- ✅ Google OAuth authentication
- ✅ Role-based access (guest, student, teacher, admin)
- ✅ User profiles
- ✅ Token refresh mechanism
- ✅ Session management with cookies

#### User Roles:
- **Guest**: Browse public content
- **Student**: Access materials, take quizzes, download documents
- **Teacher**: Upload materials, create content
- **Admin**: Full system management, approve documents, manage users

---

### 2. **Document Management System**

#### Implemented:
- ✅ Document upload (PDF, DOCX, PPTX)
- ✅ Image upload for lessons (JPG, PNG, GIF, WebP)
- ✅ Document browsing with filters
- ✅ Search functionality
- ✅ Subject categorization
- ✅ Education levels (Primary, JCE, MSCE, TVET, University, Other)
- ✅ Document types (Past Paper, Notes, Textbook, Marking Scheme, Revision Guide)
- ✅ File preview (PDF viewer)
- ✅ Download tracking
- ✅ View count tracking
- ✅ Document status workflow (pending → approved/rejected)
- ✅ Admin approval queue
- ✅ Duplicate detection (file hash-based)
- ✅ Pricing system (free or paid documents)
- ✅ Bulk upload for admins

#### File Storage:
- Supabase Storage buckets
- Organized by user ID and document type
- Public URLs for approved documents

---

### 3. **Learning Room System**

#### Implemented:
- ✅ Class/Grade management (Form 1-4, etc.)
- ✅ Subject management with icons
- ✅ Topic creation and organization
- ✅ Lesson creation with markdown content
- ✅ Rich text editing (markdown format)
- ✅ **Diagram/Image support in lessons** (upload or URL)
- ✅ Video embedding (YouTube, Vimeo)
- ✅ Lesson materials/attachments
- ✅ Lesson duration tracking
- ✅ Lesson ordering/sorting
- ✅ Topic resource linking
- ✅ Active/inactive status for topics

#### Content Structure:
```
Class → Subject → Topic → Lessons → Materials
                                    → Quizzes
```

---

### 4. **Quiz & Assessment System**

#### Implemented:
- ✅ Quiz creation per topic
- ✅ Multiple question types:
  - Multiple choice (with answers)
  - True/False
  - Short answer (manual grading)
- ✅ Points per question
- ✅ Passing score configuration
- ✅ Time limits (optional)
- ✅ Question management (add/edit/delete)
- ✅ Answer management
- ✅ Quiz activation/deactivation
- ✅ Student quiz attempts tracking

---

### 5. **Payment & Subscription System**

#### Implemented:
- ✅ Subscription plans
- ✅ Upload pass system (auto-grant after X uploads)
- ✅ Document-level payments
- ✅ Free document access
- ✅ Payment tracking
- ✅ Download limits per subscription
- ✅ Subscription expiration management

---

### 6. **Admin Dashboard**

#### Implemented:
- ✅ Document approval queue
- ✅ Document management (approve/reject/delete)
- ✅ Bulk document upload
- ✅ Duplicate log viewer
- ✅ User download history
- ✅ Learning room management
- ✅ Topic CRUD operations
- ✅ Lesson management interface
- ✅ Quiz management
- ✅ Subject management
- ✅ System settings (default pricing)
- ✅ Admin action logging

---

### 7. **Student Experience**

#### Implemented:
- ✅ Browse documents by subject/level/type
- ✅ Search documents
- ✅ Document preview
- ✅ Document download (with access control)
- ✅ Learning room access by class
- ✅ Lesson reading with markdown rendering
- ✅ Diagram/image display in lessons
- ✅ Video playback
- ✅ Download supporting materials
- ✅ Quiz taking
- ✅ Progress tracking
- ✅ User dashboard

---

### 8. **Content Rendering**

#### Implemented:
- ✅ Markdown to HTML conversion
- ✅ Image/diagram rendering in lessons
- ✅ Heading levels (H1, H2, H3)
- ✅ Bold, italic, inline code
- ✅ Bullet points and numbered lists
- ✅ Code blocks
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Prose styling for lesson content

---

## 🗄️ Database Schema

### Main Tables:

1. **users** - User accounts and profiles
2. **documents** - Uploaded documents metadata
3. **subjects** - Subject catalog
4. **subscriptions** - User subscriptions
5. **payments** - Payment records
6. **downloads** - Download tracking
7. **document_views** - View tracking
8. **admin_log** - Admin actions

### Learning Room Tables:

9. **classes** - Educational classes (Form 1-4, etc.)
10. **learning_topics** - Topics per class/subject
11. **topic_resources** - Document links to topics
12. **lessons** - Lessons per topic
13. **lesson_materials** - Supporting materials
14. **quizzes** - Quizzes per topic
15. **questions** - Quiz questions
16. **answers** - Question answers
17. **quiz_attempts** - Student attempts
18. **quiz_responses** - Student responses

### System Tables:

19. **system_settings** - Configuration
20. **duplicate_log** - Duplicate tracking
21. **document_requests** - User requests

---

## 📁 Project Structure

```
MalawiEduHub/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Supabase, Storage config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── scripts/             # Database scripts
│   └── uploads/             # Local uploads (dev)
│
├── frontend/
│   ├── app/                 # Next.js pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── auth/            # Authentication pages
│   │   ├── browse/          # Document browsing
│   │   ├── learn/           # Learning room
│   │   ├── dashboard/       # User dashboard
│   │   └── upload/          # Upload pages
│   ├── components/          # Reusable components
│   ├── lib/                 # API clients, utilities
│   └── styles/              # Global styles
│
└── database/
    └── schema*.sql          # Database schemas
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get profile
- `POST /api/auth/google` - Google OAuth

### Documents
- `GET /api/documents` - Browse documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download document
- `POST /api/documents/upload` - User upload
- `GET /api/documents/admin/queue` - Admin queue
- `POST /api/documents/admin/upload` - Admin upload
- `POST /api/documents/admin/upload-image` - Image upload for lessons
- `PATCH /api/documents/admin/:id/approve` - Approve document
- `PATCH /api/documents/admin/:id/reject` - Reject document
- `DELETE /api/documents/admin/:id` - Delete document

### Learning Room
- `GET /api/learning/classes` - Get classes
- `GET /api/learning/topics` - Get topics
- `POST /api/learning/admin/topics` - Create topic
- `PUT /api/learning/admin/topics/:id` - Update topic
- `DELETE /api/learning/admin/topics/:id` - Delete topic
- `GET /api/learning/topics/:id/resources` - Get topic resources

### Lessons
- `GET /api/lessons/topics/:topicId/lessons` - Get lessons
- `POST /api/lessons/admin/lessons` - Create lesson
- `PUT /api/lessons/admin/lessons/:id` - Update lesson
- `DELETE /api/lessons/admin/lessons/:id` - Delete lesson
- `GET /api/lessons/admin/lessons/:id/materials` - Get materials
- `POST /api/lessons/admin/lessons/:id/materials` - Add material
- `GET /api/lessons/lessons/:id` - Get lesson (student view)

### Quizzes
- `GET /api/lessons/topics/:topicId/quizzes` - Get quizzes
- `POST /api/lessons/admin/quizzes` - Create quiz
- `PUT /api/lessons/admin/quizzes/:id` - Update quiz
- `DELETE /api/lessons/admin/quizzes/:id` - Delete quiz
- `POST /api/lessons/admin/questions/:quizId` - Add question
- `POST /api/lessons/admin/answers/:questionId` - Add answer

### Subjects
- `GET /api/subjects` - List subjects
- `POST /api/subjects` - Create subject (admin)

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/downloads` - Download history
- `PATCH /api/admin/settings` - Update settings

---

## 🎨 UI/UX Features

### Implemented:
- ✅ Responsive design (mobile-first)
- ✅ Dark/light mode ready
- ✅ Loading states
- ✅ Error handling with toasts
- ✅ Form validation
- ✅ Progress indicators
- ✅ Modal dialogs
- ✅ Drawer components
- ✅ Card-based layouts
- ✅ Filter sidebar
- ✅ Search functionality
- ✅ Breadcrumb navigation
- ✅ Auto-save drafts (localStorage)
- ✅ Preview modals
- ✅ Table pagination
- ✅ Status badges
- ✅ Icon system

---

## 🔒 Security Features

### Implemented:
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (uploads, downloads)
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ File type validation
- ✅ File size limits (20MB)
- ✅ Admin role verification
- ✅ Access control for paid content
- ✅ Token refresh mechanism
- ✅ Secure cookie storage

---

## 📊 Current Feature Status

### ✅ Fully Implemented:
1. User authentication & authorization
2. Document upload & management
3. Document browsing & search
4. Learning room structure
5. Lesson creation with markdown
6. **Image/diagram support in lessons**
7. Quiz system (basic)
8. Payment/subscription system
9. Admin dashboard
10. File storage (Supabase)
11. Duplicate detection
12. Mobile responsive design

### 🚧 Partially Implemented:
1. Quiz auto-grading (multiple choice works, short answer needs manual grading UI)
2. Student progress tracking (basic tracking exists, needs dashboard)
3. Email notifications (not implemented)
4. Content versioning (not implemented)
5. Analytics dashboard (basic stats exist)

### ❌ Not Yet Implemented:
1. Rich text editor (currently markdown only)
2. Discussion forums
3. Student collaboration features
4. Mobile app
5. Offline access
6. Advanced analytics
7. Certificate generation
8. Notification system
9. Content recommendations
10. Teacher-specific features
11. Parent portal
12. Multi-language support
13. Accessibility features (WCAG)
14. API rate limiting per user
15. Backup/restore system

---

## 💡 Suggested Features to Add

### High Priority:
1. **Student Progress Dashboard**
   - Track completed lessons
   - Quiz scores history
   - Download history
   - Time spent learning

2. **Email Notifications**
   - Document approved/rejected
   - New lessons available
   - Quiz reminders
   - Subscription expiry

3. **Enhanced Quiz System**
   - Auto-grading for all question types
   - Instant feedback
   - Quiz retakes
   - Leaderboards
   - Question banks

4. **Rich Text Editor**
   - Replace markdown with WYSIWYG (Tiptap or Quill)
   - Inline image insertion
   - Formatting toolbar
   - Better UX for non-technical admins

5. **Content Recommendations**
   - "You might also like"
   - Based on browsing history
   - Popular documents
   - Related topics

### Medium Priority:
6. **Discussion/Comments**
   - Comment on documents
   - Ask questions on lessons
   - Admin/teacher responses

7. **Bookmarks & Favorites**
   - Save documents for later
   - Create collections
   - Quick access

8. **Advanced Search**
   - Full-text search
   - Filter by multiple criteria
   - Search within documents
   - Auto-complete

9. **Bulk Operations**
   - Bulk approve documents
   - Bulk delete
   - Bulk category assignment

10. **Content Versioning**
    - Track document updates
    - Version history
    - Rollback capability

### Low Priority:
11. **Gamification**
    - Badges/achievements
    - Points system
    - Learning streaks
    - Certificates

12. **Social Features**
    - Share documents
    - Study groups
    - Peer recommendations

13. **Advanced Analytics**
    - User engagement metrics
    - Popular content reports
    - Revenue analytics
    - Export reports

14. **Mobile App**
    - React Native or Flutter
    - Offline access
    - Push notifications

15. **Accessibility**
    - Screen reader support
    - Keyboard navigation
    - High contrast mode
    - Font size controls

---

## 🚀 Deployment & DevOps

### Current Setup:
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Render (automatic deployments)
- **Database**: PostgreSQL on Render
- **Storage**: Supabase Storage
- **Environment Variables**: Managed via platform dashboards

### CI/CD:
- GitHub integration
- Automatic deployments on push to main
- Environment-specific configurations

### Monitoring:
- Console logging (basic)
- Error tracking (needs Sentry integration)
- Performance monitoring (needs setup)

---

## 📝 Development Guidelines

### Code Style:
- ESLint + Prettier (frontend)
- Consistent naming conventions
- Component-based architecture
- Reusable utilities

### Git Workflow:
- Feature branches
- Main branch for production
- Commit after each feature/fix
- Descriptive commit messages

### Testing:
- Manual testing (current)
- Needs: Unit tests, integration tests, E2E tests

---

## 🔧 Configuration Files

### Backend:
- `.env` - Environment variables
- `package.json` - Dependencies
- `Procfile` - Render deployment
- `railway.json` - Railway deployment

### Frontend:
- `.env.local` - Environment variables
- `next.config.js` - Next.js config
- `tailwind.config.js` - TailwindCSS config
- `package.json` - Dependencies
- `vercel.json` - Vercel deployment

---

## 📞 Support & Maintenance

### Regular Tasks:
- Database backups
- Monitor storage usage
- Review error logs
- Update dependencies
- Security patches

### User Support:
- Contact page
- Email support (needs setup)
- FAQ section (needs creation)

---

## 🎯 Next Steps Recommendations

### Immediate (1-2 weeks):
1. Add student progress dashboard
2. Implement email notifications
3. Enhance quiz auto-grading
4. Add error tracking (Sentry)

### Short-term (1-2 months):
5. Rich text editor integration
6. Discussion/comments system
7. Bookmarks feature
8. Advanced search

### Medium-term (3-6 months):
9. Mobile app development
10. Gamification features
11. Advanced analytics
12. Content recommendation engine

---

## 📚 Additional Resources

- **Database Schema**: `/database/schema*.sql`
- **API Documentation**: See endpoints section above
- **Component Library**: `/frontend/components/`
- **Deployment Guides**: `/DEPLOY.md`, `/DEPLOY-RAILWAY.md`

---

**Last Updated**: April 2025
**Version**: 1.0.0
**Maintainer**: Development Team
