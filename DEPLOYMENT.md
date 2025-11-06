# UNiSO Network - Deployment Guide

This guide will help you deploy the UNiSO Network application with:
- **Backend**: Render (Node.js/Express API)
- **Frontend**: Vercel (React/Vite SPA)
- **Database**: Neon PostgreSQL

## 📋 Prerequisites

1. GitHub account with your code pushed
2. Render account (https://render.com)
3. Vercel account (https://vercel.com)
4. Neon database URL
5. All required API keys (Cloudinary, Twilio, Email credentials)

---

## 🚀 Backend Deployment (Render)

### Step 1: Create New Web Service

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `UnisoNetwork-main` repository

### Step 2: Configure Service

| Setting | Value |
|---------|-------|
| **Name** | `uniso-backend` |
| **Region** | Choose closest to you |
| **Branch** | `final` (or your main branch) |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

```
DATABASE_URL=postgresql://your_neon_database_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_VERIFY_SERVICE_SID=your_verify_sid
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_app_password
CAPTCHA_SECRET_KEY=your_captcha_key
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app
```

> **Note**: Add the actual `FRONTEND_URL` after deploying frontend

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build and deployment
3. Copy your backend URL: `https://uniso-backend.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Import Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select `UnisoNetwork-main`

### Step 2: Configure Build Settings

Vercel should auto-detect settings, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_BASE_URL=https://uniso-backend.onrender.com
VITE_API_URL=https://uniso-backend.onrender.com
```

> Use your actual Render backend URL from Step 1

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes
3. Copy your frontend URL: `https://uniso.vercel.app`

---

## 🔄 Update Backend with Frontend URL

### After frontend deployment:

1. Go to Render Dashboard → Your Service → **Environment**
2. Update the `FRONTEND_URL` variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-actual-app.vercel.app
   ```
3. Save changes (Render will automatically redeploy)

---

## ✅ Verify Deployment

### Test Backend
Visit: `https://uniso-backend.onrender.com`
Should see: "UNiSO API is running!"

### Test Frontend
1. Visit your Vercel URL
2. Try to sign up / log in
3. Check browser console for errors
4. Test phone verification, email verification, etc.

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly in Render
- Check that backend CORS allows your Vercel domain
- Vercel preview deployments (ending in `.vercel.app`) are automatically allowed

### API Connection Errors
- Verify `VITE_API_BASE_URL` is set in Vercel
- Check Render logs for backend errors
- Ensure database URL is correct

### Database Connection
- Verify Neon database is accessible
- Check DATABASE_URL format
- Review Render logs for connection errors

### Build Failures
- Check Node version compatibility
- Review build logs in Render/Vercel dashboard
- Ensure all dependencies are in package.json

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

- **Push to GitHub** → Automatically deploys to both platforms
- **Preview Deployments** (Vercel): Each PR gets a preview URL
- **Production Branch**: Merge to `main`/`final` for production deployment

---

## 📊 Monitoring

### Render Dashboard
- View logs: Dashboard → Service → Logs
- Monitor usage: Dashboard → Service → Metrics
- Restart service: Dashboard → Service → Manual Deploy

### Vercel Dashboard
- View deployments: Dashboard → Project → Deployments
- Check logs: Click on deployment → Function Logs
- Analytics: Dashboard → Project → Analytics

---

## 💡 Tips

1. **Free Tier Limitations**:
   - Render: Service sleeps after 15 min inactivity (cold starts)
   - Vercel: 100GB bandwidth/month on free tier

2. **Performance**:
   - First request to Render might be slow (cold start)
   - Consider upgrading to paid plans for better performance

3. **Environment Variables**:
   - Never commit `.env` files
   - Keep `.env.example` updated for reference
   - Rotate sensitive keys regularly

4. **Database**:
   - Regular backups recommended
   - Monitor Neon usage limits
   - Consider connection pooling for production

---

## 🎉 You're Done!

Your UNiSO Network is now live! 🚀

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://uniso-backend.onrender.com

For support or issues, check the logs in Render and Vercel dashboards.
