# 🚀 Quick Setup Options

## Option 1: Local PostgreSQL Installation

**Download & Install PostgreSQL:**
1. Go to: https://www.postgresql.org/download/windows/
2. Download the Windows installer
3. Install with these settings:
   - Username: postgres
   - Password: amanrai2005 (matches your .env)
   - Port: 5432
   - Install all components including command line tools

**After installation, run these commands:**
```bash
# Create database
createdb -U postgres unisonetwork

# Test connection
psql -U postgres -d unisonetwork -c "SELECT version();"
```

## Option 2: Free Cloud Database (Neon) - INSTANT SETUP

**Get started in 2 minutes:**
1. Go to: https://console.neon.tech/signup
2. Sign up with GitHub/Google
3. Create new project called "unisonetwork"
4. Copy the connection string
5. Update your .env file:

```env
DATABASE_URL=postgresql://your-username:your-password@ep-example.neon.tech/unisonetwork?sslmode=require
```

**Benefits of Neon:**
- ✅ Free tier (0.5GB storage)
- ✅ No installation required
- ✅ Works immediately
- ✅ Auto-scaling
- ✅ Built-in backups

## Option 3: Supabase (Another cloud option)

1. Go to: https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string and update .env

---

**Choose any option above, then run:**
```bash
npm run db:setup
npm run dev
```
