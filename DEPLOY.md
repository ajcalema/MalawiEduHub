# MalawiEduHub Deployment Guide

This guide will walk you through deploying MalawiEduHub to production using **Vercel** (frontend) and **Render** (backend + database).

---

## Prerequisites

- GitHub account (to push your code)
- Vercel account (free)
- Render account (free)
- AWS account (for S3 file storage - optional but recommended)

---

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/malawieduhub.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create PostgreSQL Database

1. Go to [render.com](https://render.com) and sign in
2. Click **New** → **PostgreSQL**
3. Name it: `malawieduhub-db`
4. Region: Choose closest to your users (e.g., `Frankfurt (EU Central)`)
5. Plan: **Free** or **Starter ($7/month)**
6. Click **Create Database**

### 2.2 Deploy Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `malawieduhub-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter

4. Add Environment Variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app` | Will update after Vercel deploy |
| `JWT_SECRET` | Generate strong random string | min 32 chars |
| `JWT_REFRESH_SECRET` | Generate different strong random string | min 32 chars |
| `AWS_ACCESS_KEY_ID` | Your AWS key | For S3 file storage |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret | For S3 file storage |
| `AWS_REGION` | `af-south-1` | Or your preferred region |
| `AWS_S3_BUCKET` | `malawieduhub-files` | Your bucket name |
| `PAYCHANGU_SECRET_KEY` | Your Paychangu secret | For payments |
| `PAYCHANGU_PUBLIC_KEY` | Your Paychangu public | For payments |

5. Click **Create Web Service**

### 2.3 Run Database Migrations

After deployment, open Render Shell:

```bash
# Run migrations
npm run migrate

# Create admin user
npm run ensure-admin
```

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://malawieduhub-api.onrender.com` (your Render URL)

6. Click **Deploy**

---

## Step 4: Update CORS (Important!)

After Vercel deployment, copy your Vercel domain (e.g., `https://malawieduhub.vercel.app`)

Go back to Render dashboard → your web service → Environment:

1. Update `FRONTEND_URL` to your actual Vercel domain
2. Click **Save Changes**
3. Service will redeploy automatically

---

## Step 5: Verify Deployment

Test these endpoints:

```bash
# Backend health check
curl https://your-render-url.onrender.com/health

# Frontend
open https://your-vercel-domain.vercel.app
```

---

## Production Checklist

- [ ] Database migrations ran successfully
- [ ] Admin user created
- [ ] AWS S3 bucket configured with proper CORS
- [ ] Paychangu payment keys added
- [ ] JWT secrets are strong and unique
- [ ] FRONTEND_URL matches Vercel domain exactly
- [ ] All environment variables set in Render
- [ ] Frontend builds without errors
- [ ] File uploads work
- [ ] Payments work (test with small amount)

---

## Troubleshooting

### CORS Errors
Make sure `FRONTEND_URL` in Render matches your Vercel domain exactly (including `https://`)

### Database Connection Failed
Check that your Render database is in the same region as your web service

### File Uploads Fail
- Verify AWS credentials
- Check S3 bucket CORS policy
- Ensure bucket is in the same region as specified in env vars

### Build Fails on Vercel
Check build logs for missing dependencies or syntax errors

---

## Custom Domain (Optional)

### Vercel Custom Domain
1. Go to Vercel dashboard → your project → Settings → Domains
2. Add your domain and follow DNS instructions

### Render Custom Domain
1. Go to Render dashboard → your web service → Settings → Custom Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` accordingly

---

## Support

For issues:
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- Next.js deployment: https://nextjs.org/docs/deployment
