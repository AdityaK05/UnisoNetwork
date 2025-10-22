# 🎓 Uniso - Student Community Platform

**Uniso** is a comprehensive student networking and collaboration platform designed specifically for Indian college and university students. It provides a secure, verified space for students to connect, collaborate, and access opportunities.

---

## 🌟 Features

### 🔐 Authentication & Security
- **Email-based Authentication** with OTP verification
- **College Email Validation** - Only verified Indian college/university emails allowed
  - Supports `.ac.in`, `.edu.in`, `.org.in`, `.edu` domains
  - Whitelist of 170+ Indian institutions (IITs, NITs, IIITs, VIT, BITS, SRM, Amity, etc.)
- **Student ID Verification** using OCR technology
  - Automatic verification with 80% weighted matching algorithm
  - Extracts: Name, Roll Number, College Name, ID Number
  - Cloudinary integration for secure image storage
  - Tesseract.js for text extraction

### 👥 Social Features
- **User Profiles** with avatar support
- **Groups & Communities**
  - Create and join student groups
  - Group membership management
  - Private group discussions
- **Forums & Discussions**
  - Topic-based forums
  - Post and comment system
  - Community engagement

### 💼 Opportunities
- **Internship Listings**
  - Browse available internships
  - Filter by type and domain
  - Post internship opportunities
- **Company Directory**
  - Company profiles
  - Hiring information
  - Industry connections

### 📚 Resources
- **Events Calendar**
  - Upcoming college events
  - Webinars and workshops
  - Event registration
- **Resource Sharing**
  - Study materials
  - Notes and documents
  - Academic resources

---

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wouter** - Routing
- **React Hot Toast** - Notifications
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM

### Authentication & Security
- **JWT (JSON Web Tokens)** - Session management
- **bcryptjs** - Password hashing
- **Nodemailer** - Email OTP delivery via Gmail SMTP
- **Google reCAPTCHA v3** - Bot protection
- **Rate Limiting** - Prevents abuse (3 attempts per 15 min)

### ID Verification
- **Tesseract.js** - OCR text extraction
- **Sharp** - Image preprocessing
- **Cloudinary** - Cloud image storage (25GB free tier)
- **Custom Bigram Algorithm** - Fuzzy string matching

### DevOps
- **Docker** support
- **ESLint & Prettier** - Code quality
- **Vitest** - Unit testing

---

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/unisonetwork?sslmode=disable

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here

# Email Service (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary (ID Card Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google reCAPTCHA v3
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/unisonetwork.git
cd unisonetwork
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Create PostgreSQL database
createdb unisonetwork

# Run migrations (auto-runs on first start)
npm run dev
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5000`
- Backend API: `http://localhost:5000/api`

---

## 🔑 Key Features Explained

### 1. College Email Verification

**Purpose:** Ensure only verified college students can sign up

**How it works:**
- Validates email domain against patterns: `.ac.in`, `.edu.in`, `.org.in`, `.edu`
- Checks against whitelist of 170+ Indian college keywords
- Rejects personal emails (Gmail, Yahoo, Outlook, etc.)

**Example:**
```javascript
✅ student@vit.ac.in         → Valid
✅ john@iitb.ac.in          → Valid
❌ user@gmail.com           → Rejected
```

### 2. Student ID Verification

**Purpose:** Verify student identity through college ID card

**Verification Process:**
1. Student uploads ID card image
2. OCR extracts text (name, roll number, college, ID)
3. System compares with user-provided data
4. Weighted matching algorithm:
   - Name → 40%
   - Roll Number → 30%
   - College Name → 20%
   - ID Number → 10%
5. ≥80% match = ✅ Verified

**Response Format:**
```json
{
  "success": true,
  "matchScore": 0.86,
  "verificationStatus": "Verified",
  "mismatchedFields": [],
  "parsedData": {
    "name": "Aditya Kaushik",
    "roll_number": "21CS1234",
    "college_name": "VIT University",
    "id_number": "VIT21CS1234"
  }
}
```

### 3. Email OTP System

**Purpose:** Verify email ownership during signup

**Features:**
- 6-digit OTP sent via Gmail SMTP
- 10-minute expiry time
- 60-second resend cooldown
- Rate limiting (3 attempts per 15 min)
- Beautiful HTML email templates

**Cost:** 100% FREE (no SMS charges)

---

## 🗂️ Project Structure

```
UnisoNetwork/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── SignupWithEmail.tsx
│   │   │   ├── IdCardUpload.tsx
│   │   │   ├── landing/       # Landing page components
│   │   │   ├── layout/        # Layout components
│   │   │   └── ui/            # Shadcn UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   │       └── collegeEmailValidator.ts
│   └── public/                # Static assets
├── server/                    # Backend Express app
│   ├── db/                    # Database config & migrations
│   │   ├── schema.sql
│   │   └── index.ts
│   ├── middleware/            # Express middlewares
│   │   ├── rateLimiter.ts
│   │   └── imageValidation.ts
│   ├── services/              # Business logic
│   │   ├── emailVerification.ts
│   │   ├── idVerification.ts
│   │   └── captcha.ts
│   ├── utils/                 # Utility functions
│   │   └── collegeEmailValidator.ts
│   ├── scripts/               # Utility scripts
│   │   └── clear-all-data.ts
│   ├── routes.ts              # API routes
│   ├── storage.ts             # Database queries
│   └── index.ts               # Server entry point
├── shared/                    # Shared types
│   └── schema.ts
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/email/send-otp-signup` - Send OTP for signup
- `POST /api/users/signup-with-email` - Create account with email verification
- `POST /api/users/login` - Login with email/password
- `GET /api/users/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/my` - Get user's groups
- `POST /api/groups/:id/join` - Join a group

### Forums
- `GET /api/forums` - Get all forums
- `POST /api/forums` - Create new forum
- `GET /api/forums/:id/posts` - Get forum posts
- `POST /api/forums/:id/posts` - Create new post

### ID Verification
- `GET /api/id-verification/status` - Check verification status
- `POST /api/id-verification/upload-id` - Upload & verify ID card
- `PUT /api/id-verification/update-profile` - Update student details

### Internships
- `GET /api/internships` - Get all internships
- `POST /api/internships` - Create internship listing

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create company profile

---

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

---

## 🔒 Security Features

1. **Rate Limiting**
   - OTP: 3 attempts per 15 minutes
   - ID Verification: 3 attempts per 24 hours

2. **CAPTCHA Protection**
   - Google reCAPTCHA v3
   - Score-based verification (0.5 threshold)

3. **Input Validation**
   - Email format validation
   - College domain verification
   - File type & size validation (5MB limit)
   - SQL injection prevention

4. **Authentication**
   - JWT tokens with 7-day expiry
   - bcrypt password hashing (10 rounds)
   - Secure session management

5. **Data Protection**
   - Environment variables for secrets
   - HTTPS recommended for production
   - CORS configuration

---

## 📊 Database Schema

### Users Table
```sql
- id (Primary Key)
- name
- email (Unique)
- password_hash
- avatar_url
- roll_number
- college_name
- student_name
- id_number
- id_card_image_url
- is_id_verified
- id_verification_attempts
- last_verification_attempt
- verified_at
- created_at
- updated_at
```

### Groups, Forums, Internships, Companies, Events, Resources
See `server/db/schema.sql` for complete schema.

---

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production database URL
- Set up proper CORS origins
- Enable HTTPS

---

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npx tsx server/scripts/clear-all-data.ts` - Clear all database data

---

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time chat system
- [ ] Video conferencing integration
- [ ] Advanced AI-powered matching
- [ ] Resume builder
- [ ] Interview preparation resources
- [ ] Alumni network
- [ ] Job board integration
- [ ] Scholarship opportunities
- [ ] Project collaboration tools

---

**Made with ❤️ for Indian Students**
