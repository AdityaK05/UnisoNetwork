# 🚀 Quick Deployment Reference

## ✅ Database Setup - COMPLETED!

Your PostgreSQL database is now ready on Render:
- **Database Name**: unisodb_xjo1
- **Tables Created**: ✅ 9 tables (users, companies, internships, forum_threads, forum_replies, groups, group_members, events, resources)
- **Sample Data**: ✅ 6 companies pre-loaded (Google, Microsoft, Meta, Netflix, Amazon, Apple)

---

## 📋 Next Steps for Render Backend Deployment

### 1. Add Environment Variables to Your Backend Service

Go to Render Dashboard → Your Backend Web Service → **Environment** tab

Add these variables:

```
DATABASE_URL
postgresql://unisodb_xjo1_user:4IIgndjdJHk91iZzCRDtfJKrYCl8wbLf@dpg-d46441u3jp1c73dsrsq0-a.oregon-postgres.render.com/unisodb_xjo1

NODE_ENV
production

PORT
10000

FRONTEND_URL
(Add after Vercel deployment - e.g., https://uniso.vercel.app)

# Add your actual credentials below:
CLOUDINARY_CLOUD_NAME
your_cloudinary_name

CLOUDINARY_API_KEY
your_cloudinary_key

CLOUDINARY_API_SECRET
your_cloudinary_secret

TWILIO_ACCOUNT_SID
your_twilio_sid

TWILIO_AUTH_TOKEN
your_twilio_token

TWILIO_VERIFY_SERVICE_SID
your_verify_sid

EMAIL_USER
your_email@gmail.com

EMAIL_PASSWORD
your_gmail_app_password

CAPTCHA_SECRET_KEY
your_captcha_key (optional)
```

### 2. Your Backend Service Configuration

Make sure your backend service has:
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Runtime**: Node

### 3. After Backend Deploys

1. Copy your backend URL (e.g., `https://uniso-backend.onrender.com`)
2. Test it by visiting: `https://your-backend-url.onrender.com` 
   - You should see: "UNiSO API is running!"

---

## 🎨 Vercel Frontend Deployment

### Configuration:

| Setting | Value |
|---------|-------|
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Framework Preset** | Vite |

### Environment Variables:

```
VITE_API_BASE_URL
https://your-backend-url.onrender.com

VITE_API_URL
https://your-backend-url.onrender.com
```

### After Frontend Deploys:

1. Copy your Vercel URL
2. Go back to Render Backend → Environment
3. Update `FRONTEND_URL` with your Vercel URL
4. Service will auto-redeploy

---

## 🔗 Important URLs

### Database (Render PostgreSQL)
- Internal: `postgresql://unisodb_xjo1_user:...@dpg-d46441u3jp1c73dsrsq0-a.oregon-postgres.render.com/unisodb_xjo1`

### Backend (To be deployed)
- URL: `https://[your-service-name].onrender.com`
- API Endpoint: `https://[your-service-name].onrender.com/api`

### Frontend (To be deployed)
- URL: `https://[your-app-name].vercel.app`

---

## ⚠️ Important Notes

1. **Free Tier Limits**:
   - Render: Backend sleeps after 15min inactivity (cold starts ~30s)
   - Vercel: 100GB bandwidth/month
   - Neon DB: Connection pooling recommended

2. **Security**:
   - Never commit `.env` files to git
   - Use App Passwords for Gmail (not regular password)
   - Rotate keys regularly

3. **CORS**:
   - Already configured to accept requests from `.vercel.app` domains
   - Manual FRONTEND_URL needed for specific domain

---

## 🎯 Deployment Checklist

### Backend (Render):
- [x] Database created and initialized
- [ ] Backend service created
- [ ] All environment variables added
- [ ] Service deployed successfully
- [ ] Backend URL copied

### Frontend (Vercel):
- [ ] Project imported from GitHub
- [ ] Root directory set to `client`
- [ ] Environment variables added
- [ ] Service deployed
- [ ] Frontend URL copied
- [ ] FRONTEND_URL updated in backend

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection locally
node server/db/init-database.js
```

### Check Backend Logs
- Render Dashboard → Your Service → Logs

### Check Frontend Logs  
- Vercel Dashboard → Your Project → Deployment → Function Logs

---

## 📞 Need Help?

- Full guide: See `DEPLOYMENT.md`
- Database init script: `server/db/init-database.js`
- Schema file: `server/db/schema.sql`

**Your database is ready! Now deploy your backend and frontend services.** 🚀
