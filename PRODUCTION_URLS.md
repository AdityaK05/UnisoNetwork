# 🎉 UNiSO Network - Production URLs

## 🌐 Live Application

### **Backend API**
- **URL**: https://uniso-backend.onrender.com
- **Status Endpoint**: https://uniso-backend.onrender.com/
- **API Base**: https://uniso-backend.onrender.com/api

### **Frontend** (To be deployed)
- **Platform**: Vercel
- **URL**: `https://your-app.vercel.app` (Add after deployment)

### **Database**
- **Platform**: Render PostgreSQL
- **Name**: unisodb_xjo1
- **Status**: ✅ Live and configured

---

## 📋 Environment Variables Reference

### **Backend (Render)**
Already configured with these variables:
```
DATABASE_URL=postgresql://unisodb_xjo1_user:...@dpg-d46441u3jp1c73dsrsq0-a.oregon-postgres.render.com/unisodb_xjo1
JWT_SECRET=shraddhamishra110022996541789035&&*^
PORT=10000
CLOUDINARY_CLOUD_NAME=dqu98bbec
CLOUDINARY_API_KEY=925497522794171
CLOUDINARY_API_SECRET=H39C8gMeg_JDvzUZCsq2mtTCVCM
RECAPTCHA_SECRET_KEY=6LcMDvMrAAAAAKna_4yXKzs9bzXmiT_Cp_JZ3-Wj
RECAPTCHA_SITE_KEY=6LcMDvMrAAAAAHIG-D1TwyDipZga7NU6JkZkqGh2
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=adityagr8.05@gmail.com
EMAIL_PASS=lehkvhwpalovyrhb
```

**TO ADD AFTER FRONTEND DEPLOYMENT:**
```
FRONTEND_URL=https://your-vercel-url.vercel.app
```

### **Frontend (Vercel)**
Add these in Vercel dashboard:
```
VITE_API_BASE_URL=https://uniso-backend.onrender.com
VITE_API_URL=https://uniso-backend.onrender.com
```

---

## 🚀 Deployment Status

- [x] Database created and initialized (9 tables)
- [x] Backend deployed on Render
- [x] Backend environment variables configured
- [x] Backend URL: https://uniso-backend.onrender.com
- [ ] Frontend deployed on Vercel
- [ ] Frontend URL obtained
- [ ] FRONTEND_URL added to backend
- [ ] End-to-end testing completed

---

## 🧪 Testing Your Backend

### Test if backend is live:
```bash
curl https://uniso-backend.onrender.com/
```
Expected response: "UNiSO API is running!"

### Test API endpoint:
```bash
curl https://uniso-backend.onrender.com/api/internships
```

---

## 📝 Next Steps

1. **Deploy Frontend on Vercel**:
   - Framework: Vite
   - Root Directory: `client`
   - Add environment variables above

2. **Update Backend CORS**:
   - Add `FRONTEND_URL` with your Vercel URL
   - Backend will auto-redeploy

3. **Test Application**:
   - Sign up / Login
   - Phone verification
   - Email verification
   - All features

---

## 🔗 Quick Links

- **Backend Dashboard**: https://dashboard.render.com
- **Frontend Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/AdityaK05/UnisoNetwork
- **Database**: Render PostgreSQL Dashboard

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set in backend
- Check Render backend logs

### API Not Responding
- Check if backend is awake (free tier sleeps after 15min)
- First request may take 30s (cold start)

### Build Failures
- Check Vercel deployment logs
- Ensure `Root Directory` is set to `client`
- Verify environment variables are set

---

**Your backend is live! Deploy the frontend next!** 🎊
