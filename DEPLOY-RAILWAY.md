# MalawiEduHub Deployment Guide - Vercel + Railway + Supabase (FREE)

This guide deploys MalawiEduHub using completely free tiers:
- **Vercel**: Frontend hosting (free)
- **Railway**: Backend hosting (free $5 credit/month)
- **Supabase**: PostgreSQL database (free 500MB)

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| **Vercel** | 100GB bandwidth, 10s functions |
| **Railway** | $5 credit/month (~500 hours uptime) |
| **Supabase** | 500MB database, 2GB bandwidth |

---

## Prerequisites

- GitHub account
- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account  
- [Supabase](https://supabase.com) account

---

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `malawieduhub`
3. Choose region closest to your users
4. Wait for database to be ready (~2 minutes)
5. Go to **Project Settings** → **Database**
6. Copy **Connection string** (URI format)
   - It looks like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

---

## Step 2: Deploy Backend to Railway

### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push
```

### 2.2 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway will auto-detect the `railway.json` config

### 2.3 Add Environment Variables

In Railway dashboard → your project → Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | Generate random 32+ char string |
| `JWT_REFRESH_SECRET` | Generate different random string |
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app` (update after Vercel deploy) |
| `BACKEND_URL` | `https://malawieduhub-api.up.railway.app` (your Railway URL) |
| `PAYCHANGU_SECRET_KEY` | Your Paychangu secret |
| `PAYCHANGU_PUBLIC_KEY` | Your Paychangu public |
| `PAYCHANGU_BASE_URL` | `https://api.paychangu.com` |

### 2.4 Deploy

Railway will auto-deploy. Check **Deployments** tab for status.

### 2.5 Run Database Migrations

In Railway dashboard → your service → **Shell**:

```bash
cd backend
npm run migrate
npm run ensure-admin
```

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repo
3. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `next build`
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://malawieduhub-api.up.railway.app`
5. Click **Deploy**

---

## Step 4: Update CORS & Environment

After Vercel deploy:

1. Copy your Vercel URL (e.g., `https://malawieduhub.vercel.app`)
2. Go to Railway dashboard → Variables
3. Update `FRONTEND_URL` to your Vercel URL
4. Railway will redeploy automatically

---

## Step 5: Verify Deployment

```bash
# Test backend
curl https://your-railway-url.up.railway.app/health

# Open frontend
open https://your-vercel-url.vercel.app
```

---

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` is correct
- Ensure Supabase project is active (not paused)
- Try connecting with psql: `psql "your-connection-string"`

### CORS Errors
- Verify `FRONTEND_URL` matches Vercel domain exactly
- Include `https://` prefix

### Railway Deployment Fails
- Check **Deploy Logs** in Railway dashboard
- Ensure `railway.json` is in root directory
- Verify `package.json` has `"start": "node src/server.js"`

### Supabase Connection Issues
- Go to Supabase → Database → Connection Pooling
- Use the pooled connection string if direct fails

---

## Keeping Within Free Limits

**Railway ($5 credit)**:
- ~500 hours of uptime per month
- Set up a ping service (like UptimeRobot) to prevent sleeping
- Monitor usage in Railway dashboard

**Supabase (500MB)**:
- Monitor database size in Supabase dashboard
- Clean up old documents if needed
- Upgrade to Pro ($25/month) if you exceed limits

---

## Switching to Production Paychangu

When ready for real payments:
1. Get live keys from Paychangu dashboard
2. Update `PAYCHANGU_SECRET_KEY` and `PAYCHANGU_PUBLIC_KEY` in Railway
3. Railway will auto-redeploy

---

## Support

- Railway docs: https://docs.railway.app
- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
