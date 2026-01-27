# 🚀 Deployment Guide - Last Piece E-Commerce

Complete guide to deploy **Last Piece** on **Netlify** (Frontend) and **Render** (Backend).

---

## 📋 Prerequisites

Before deployment, ensure you have:

1. ✅ **GitHub Account** - Code pushed to GitHub
2. ✅ **Netlify Account** - [Sign up free](https://netlify.com)
3. ✅ **Render Account** - [Sign up free](https://render.com)
4. ✅ **MongoDB Atlas Account** - [Sign up free](https://mongodb.com/cloud/atlas)

---

## Part 1: Backend Deployment (Render) 🔧

### Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas)
2. Create a new cluster (FREE tier available)
3. Create database user:
   - Go to **Database Access**
   - Add new user with username/password
   - Save credentials securely
4. Whitelist IP addresses:
   - Go to **Network Access**
   - Click **Add IP Address**
   - Select **Allow Access from Anywhere** (0.0.0.0/0)
5. Get connection string:
   - Go to **Database** → **Connect**
   - Choose **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your actual password

**Example Connection String:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lastpiece?retryWrites=true&w=majority
```

---

### Step 2: Deploy Backend to Render

1. **Login to Render**: Go to [render.com](https://render.com)

2. **Create New Web Service**:
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Select the `last-Piece-e-commerce` repository

3. **Configure Service**:
   - **Name**: `lastpiece-backend` (or any name you prefer)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables** (CRITICAL):
   Click **Advanced** → **Add Environment Variable** and add:

   ```env
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lastpiece?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars-CHANGE-THIS
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-CHANGE-THIS
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   FRONTEND_URL=https://your-site-name.netlify.app
   ```

   **⚠️ IMPORTANT**:
   - Generate strong random strings for JWT secrets (min 32 characters)
   - Replace MongoDB credentials
   - Update FRONTEND_URL after deploying frontend

5. **Generate Strong Secrets** (optional):
   ```bash
   # On your terminal, generate random secrets:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. **Create Service**: Click **Create Web Service**

7. **Wait for Deployment**: Render will build and deploy (2-5 minutes)

8. **Copy Backend URL**: After deployment, copy your backend URL:
   ```
   https://lastpiece-backend.onrender.com
   ```

---

## Part 2: Frontend Deployment (Netlify) 🎨

### Step 1: Deploy Frontend to Netlify

1. **Login to Netlify**: Go to [netlify.com](https://netlify.com)

2. **Import Project**:
   - Click **Add new site** → **Import an existing project**
   - Choose **GitHub**
   - Select `last-Piece-e-commerce` repository

3. **Configure Build Settings**:
   - Netlify will auto-detect settings from `netlify.toml` in your repo
   - Just verify:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend/.next`
   - These are already configured in the `netlify.toml` file

4. **Environment Variables**:
   Click **Site settings** → **Environment variables** → **Add a variable**:

   ```env
   NODE_VERSION=18
   NEXT_PUBLIC_API_URL=https://lastpiece-backend.onrender.com/api
   NEXT_PUBLIC_SITE_URL=https://your-site-name.netlify.app
   ```

   **⚠️ IMPORTANT**:
   - Replace URLs with your actual Render backend URL
   - `NODE_VERSION=18` is required for Next.js 14

5. **Deploy**: Click **Deploy site**

6. **Wait for Deployment**: Netlify will build and deploy (3-7 minutes)

---

### Step 2: Update Backend Environment

After deploying frontend:

1. Go back to **Render Dashboard**
2. Select your backend service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` with your Netlify URL:
   ```
   FRONTEND_URL=https://your-actual-site.netlify.app
   ```
5. Save and wait for auto-redeploy

---

### Step 3: Update Backend URL in netlify.toml

1. Open `netlify.toml` in your repository (at the root level)
2. Update line 15 with your actual Render backend URL:
   ```toml
   to = "https://your-actual-backend.onrender.com/api/:splat"
   ```
3. Commit and push this change to trigger a new deployment

---

## Part 3: Verify Deployment ✅

### Test Backend
1. Visit: `https://your-backend.onrender.com`
2. Should see: `{"success":true,"message":"Last Piece API Server"...}`

### Test Frontend
1. Visit: `https://your-site.netlify.app`
2. Should see the homepage
3. Test login with default accounts (see README.md)

### Test Connection
1. Try to login on frontend
2. Check if products load
3. Test add to cart functionality

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: 503 Service Unavailable
- **Solution**: Wait 1-2 minutes. Free tier services sleep after inactivity.

**Problem**: Database connection failed
- **Solution**: 
  - Check MongoDB Atlas connection string
  - Verify IP whitelist includes 0.0.0.0/0
  - Check database user credentials

**Problem**: CORS errors
- **Solution**: Verify `FRONTEND_URL` in backend matches your Netlify URL exactly

### Frontend Issues

**Problem**: API calls fail (404/500)
- **Solution**: 
  - Verify `NEXT_PUBLIC_API_URL` is correct
  - Check backend is deployed and running
  - Update `netlify.toml` redirect URL

**Problem**: Build fails with "publish directory not found"
- **Solution**:
  - Set publish directory to `frontend/.next` (full path from repo root)
  - Set base directory to `frontend`
  - See `NETLIFY_TROUBLESHOOTING.md` for detailed solutions

**Problem**: Other build failures
- **Solution**:
  - Check build logs in Netlify
  - Verify all dependencies in `package.json`
  - Try clearing cache and redeploying
  - Run `npm run build` locally to test

---

## 🎯 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] User can register/login
- [ ] Products display properly
- [ ] Cart functionality works
- [ ] Admin panel accessible
- [ ] Images load correctly
- [ ] API calls successful

---

## 🔐 Security Reminders

1. **Change Default Passwords**: Update all default admin/user passwords
2. **Use Strong JWT Secrets**: Generate random 32+ character strings
3. **Enable HTTPS Only**: Both Netlify and Render provide SSL by default
4. **Whitelist IPs**: In production, limit MongoDB access to specific IPs
5. **Monitor Logs**: Check Render and Netlify logs regularly

---

## 📊 Free Tier Limits

### Render Free Tier
- ✅ 750 hours/month
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ Cold start ~30 seconds
- ✅ Automatic SSL

### Netlify Free Tier
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic SSL
- ✅ CDN included

### MongoDB Atlas Free Tier
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Good for ~5000 products

---

## 🚀 Upgrading to Production

For better performance, consider:

1. **Render**: Upgrade to paid tier ($7/month) for:
   - No sleep time
   - Faster cold starts
   - More resources

2. **MongoDB**: Upgrade for:
   - More storage
   - Better performance
   - Automated backups

3. **Netlify**: Usually free tier is sufficient

---

## 📞 Support

If you encounter issues:
1. Check deployment logs in Render/Netlify
2. Review this guide carefully
3. Check MongoDB Atlas connection
4. Open an issue on GitHub

---

**🎉 Congratulations! Your e-commerce platform is now live!**

Share your deployment URL: `https://your-site.netlify.app`
