# UNiSO Network - PostgreSQL Backend Setup Guide

## 🗄️ Database Setup

### Prerequisites
- **PostgreSQL** installed on your system
- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Step 1: Install PostgreSQL

#### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

#### macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database
createdb unisonetwork
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE unisonetwork;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE unisonetwork TO your_username;
\q
```

### Step 2: Configure Database Connection

1. Update the `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/unisonetwork
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
```

**Replace `username`, `password`, and database name with your actual credentials.**

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Setup Database Schema

Run the database setup script to create all tables:

```bash
npm run db:setup
```

This will:
- ✅ Test your database connection
- ✅ Create all necessary tables (users, companies, internships, events, groups, resources, forums)
- ✅ Add sample company data
- ✅ Create proper indexes for performance

### Step 5: Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

## 🏗️ Database Schema Overview

### Core Tables:
- **`users`** - User accounts and authentication
- **`companies`** - Company information for internships
- **`internships`** - Job postings and internship opportunities
- **`events`** - Campus events and workshops
- **`groups`** - Student communities and study groups
- **`resources`** - Educational resources and materials
- **`forum_posts`** - Discussion threads and real talks

### Features:
- 🔐 **JWT Authentication** with secure password hashing
- 🔍 **Full-text search** across all content
- 📊 **Filtering and sorting** for all data types
- 👥 **User management** with profiles and avatars
- 📱 **RESTful API** endpoints for all operations

## 🚀 API Endpoints

### Authentication
- `POST /api/users` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user (authenticated)
- `POST /api/users/logout` - User logout

### Internships & Jobs
- `GET /api/internships` - Get all internships (with filtering)
- `POST /api/internships` - Create new internship (authenticated)

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event (authenticated)

### Groups & Community
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group (authenticated)

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create new resource (authenticated)

### Forums (Real Talks)
- `GET /api/forums` - Get forum posts
- `POST /api/forums` - Create new forum post (authenticated)

### Search
- `GET /api/search?q=query&type=internships|events|resources` - Search all content

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Setup database (run once)
npm run db:setup

# Type checking
npm run check

# Push schema changes (if using Drizzle migrations)
npm run db:push
```

## 🐛 Troubleshooting

### Database Connection Issues:
1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   services.msc (look for PostgreSQL service)
   
   # macOS/Linux
   brew services list | grep postgresql
   sudo systemctl status postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U your_username -d unisonetwork -h localhost -p 5432
   ```

3. **Check `.env` file** - ensure DATABASE_URL is correct

### Common Errors:

**"relation does not exist"** → Run `npm run db:setup`

**"password authentication failed"** → Check your DATABASE_URL credentials

**"database does not exist"** → Create database: `createdb unisonetwork`

**"JWT_SECRET not found"** → Add JWT_SECRET to your `.env` file

## 🌐 Cloud Database Options

Instead of local PostgreSQL, you can use cloud providers:

### Neon (Recommended for development):
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update `.env`: `DATABASE_URL=postgresql://...neon.tech/...`

### Supabase:
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Update `.env` with the connection string

### Railway/Render:
Both offer PostgreSQL databases with similar setup processes.

## 📁 Project Structure

```
server/
├── db/
│   ├── index.ts         # Database connection
│   ├── schema.sql       # Database schema
│   └── setup.js         # Setup script
├── index.ts             # Express server
├── routes.ts            # API routes
└── storage.ts           # Database operations

shared/
└── schema.ts            # TypeScript types (Drizzle schema)

client/
└── src/
    ├── services/
    │   └── auth.ts      # API client
    └── hooks/
        └── AuthContext.tsx
```

## 🔒 Security Features

- ✅ **Password hashing** with bcryptjs
- ✅ **JWT tokens** for authentication  
- ✅ **SQL injection protection** with parameterized queries
- ✅ **Input validation** on all endpoints
- ✅ **CORS configuration** for client-server communication
- ✅ **Environment variables** for sensitive data

## 📦 Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set environment variables:**
   ```env
   NODE_ENV=production
   DATABASE_URL=your-production-db-url
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Run setup on production database:**
   ```bash
   npm run db:setup
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

---

## 🎉 You're All Set!

Your UNiSO Network backend with PostgreSQL is now ready! The application includes:

- ✅ Complete authentication system
- ✅ All major features (internships, events, groups, resources, forums)
- ✅ Search functionality
- ✅ RESTful API endpoints
- ✅ Type-safe database operations
- ✅ Production-ready setup

**Happy coding!** 🚀
