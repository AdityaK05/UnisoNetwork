# Admin & Placement Coordinator Job Portal

Complete implementation of an admin job posting system for UNISO platform.

## 🎯 Features

### Authentication & Access Control
- ✅ Role-based access control (Admin, Coordinator, Student)
- ✅ JWT-based authentication middleware
- ✅ Separate permissions for creating/editing vs viewing jobs
- ✅ Protected admin routes with `verifyAdminOrCoordinator` middleware

### Backend API Endpoints

#### Admin/Coordinator Routes (Protected)
- `POST /api/admin/jobs` - Create new job/internship listing
- `GET /api/admin/jobs` - Fetch all jobs created by logged-in admin/coordinator
- `PUT /api/admin/jobs/:id` - Edit a specific job posting
- `DELETE /api/admin/jobs/:id` - Delete a job posting

#### Public Routes (Students)
- `GET /api/jobs` - Fetch all active job listings (with filters)
- `GET /api/jobs/:id` - Get detailed view of a single job

### Database Schema

**Jobs Table:**
```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  job_type VARCHAR(20) CHECK (job_type IN ('Internship', 'Full-time', 'Part-time')),
  salary_range VARCHAR(100),
  skills_required TEXT[],
  application_deadline DATE,
  application_link TEXT,
  posted_by INTEGER REFERENCES users(id),
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('Active', 'Closed')) DEFAULT 'Active',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Users Table Update:**
- Added `role` column: `VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'coordinator'))`

### Frontend Components

**Admin Dashboard (`/admin/jobs`)**
- Create new job postings with rich form
- View all jobs created by the admin
- Edit existing job postings
- Delete job postings
- Toggle job status (Active/Closed)
- Real-time validation and error handling

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
cd C:\Users\adity\OneDrive\Desktop\unisofinal\UnisoNetwork-main
npx tsx -e "import pg from 'pg'; import dotenv from 'dotenv'; import fs from 'fs'; dotenv.config(); const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); const sql = fs.readFileSync('server/db/add-jobs-table.sql', 'utf-8'); pool.query(sql).then(() => { console.log('✅ Jobs table created!'); process.exit(0); });"
```

### 2. Set User Role to Admin

To make a user an admin or coordinator:

```bash
npx tsx server/db/set-user-role.ts <email> admin
# or
npx tsx server/db/set-user-role.ts <email> coordinator
```

**Example:**
```bash
npx tsx server/db/set-user-role.ts user@vit.ac.in admin
```

### 3. Access Admin Portal

1. Login with your admin account
2. Navigate to: `http://localhost:5173/admin/jobs`
3. Start creating job postings!

## 📂 Files Created/Modified

### Backend
- ✅ `server/db/add-jobs-table.sql` - Database migration
- ✅ `server/db/set-user-role.ts` - Helper script to set user roles
- ✅ `server/middleware/adminAuth.ts` - Admin authentication middleware
- ✅ `server/routes.ts` - Added 6 new API endpoints

### Frontend
- ✅ `client/src/pages/admin-jobs.tsx` - Admin dashboard component
- ✅ `client/src/App.tsx` - Added `/admin/jobs` route

## 🔐 Security Features

1. **JWT Authentication**: All admin routes require valid JWT token
2. **Role-Based Access**: Middleware verifies user role before granting access
3. **Ownership Verification**: Users can only edit/delete their own job postings
4. **SQL Injection Prevention**: Parameterized queries throughout
5. **Input Validation**: Both frontend and backend validation

## 📊 API Response Examples

### Create Job (POST /api/admin/jobs)
**Request:**
```json
{
  "title": "Software Engineer Intern",
  "company_name": "Google",
  "description": "Work on cutting-edge technologies...",
  "location": "Bangalore",
  "job_type": "Internship",
  "salary_range": "₹50,000/month",
  "skills_required": "React, Node.js, MongoDB",
  "application_deadline": "2025-12-31",
  "application_link": "https://google.com/careers/apply"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job posted successfully",
  "job": {
    "id": 1,
    "title": "Software Engineer Intern",
    "company_name": "Google",
    ...
  }
}
```

### Get All Jobs (GET /api/jobs?job_type=Internship&location=Bangalore)
**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": 1,
      "title": "Software Engineer Intern",
      "company_name": "Google",
      "posted_by_name": "Admin User",
      ...
    }
  ]
}
```

## 🎨 UI Features

- **Modern Design**: Clean, professional interface using Shadcn UI components
- **Responsive Layout**: Works on desktop and mobile devices
- **Real-time Feedback**: Toast notifications for all actions
- **Form Validation**: Client-side validation before API calls
- **Status Badges**: Visual indicators for job status and type
- **Skill Tags**: Clean display of required skills
- **Action Buttons**: Edit, Delete, Toggle Status for each job

## 🧪 Testing

1. **Create a test admin user:**
   ```bash
   # After creating account through signup
   npx tsx server/db/set-user-role.ts your-email@college.ac.in admin
   ```

2. **Test admin routes:**
   - Visit `/admin/jobs`
   - Create a new job posting
   - Edit the job
   - Toggle status (Active/Closed)
   - Delete the job

3. **Test student view:**
   - Logout and login as student (or use incognito)
   - Visit `/internships` (if you integrate the public jobs view there)
   - Should see jobs but NOT be able to create/edit

## 🔄 Integration with Existing Features

The job portal seamlessly integrates with your existing UNISO features:
- Uses same JWT authentication system
- Reuses existing database connection pool
- Follows same code structure and patterns
- Compatible with existing middleware

## 📝 Next Steps (Optional Enhancements)

1. **Application Tracking**: Allow students to apply to jobs and track applications
2. **Email Notifications**: Send alerts when new jobs are posted
3. **Analytics Dashboard**: Show job posting statistics to admins
4. **Bulk Upload**: CSV import for multiple job postings
5. **Job Categories**: Add tags/categories for better filtering
6. **Approval Workflow**: Multi-step approval before job goes live

## ⚠️ Important Notes

- Default user role is `student` - must manually set admin/coordinator role
- Only admins/coordinators can access `/admin/jobs` route
- Students can view all active jobs through public endpoints
- Job postings are soft-deletable (actually deleted from DB)
- Skills are stored as PostgreSQL array for efficient querying

## 🆘 Troubleshooting

**"Access denied" error:**
- Ensure user role is set to `admin` or `coordinator`
- Check JWT token is valid and not expired

**Jobs table doesn't exist:**
- Run the migration script again
- Check PostgreSQL connection

**Cannot create jobs:**
- Verify authentication token in localStorage
- Check network tab for API errors
- Ensure all required fields are filled

---

✅ **Implementation Complete!** The Admin & Placement Coordinator Job Portal is now fully functional and ready to use.
