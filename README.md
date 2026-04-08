# MalawiEduHub — Complete Project

Malawi's centralised digital library for educational resources.
Students and teachers can upload, search, and download past papers,
notes, textbooks and revision materials.

---

## Project structure

```
MalawiEduHub/
├── database/
│   └── schema.sql          PostgreSQL schema — run this first
├── backend/                Node.js + Express REST API
│   ├── src/
│   │   ├── server.js       Entry point (port 4000)
│   │   ├── config/
│   │   │   ├── db.js       PostgreSQL connection pool
│   │   │   └── storage.js  AWS S3 + signed URL helpers
│   │   ├── middleware/
│   │   │   └── auth.js     JWT auth, role guards, access checks
│   │   ├── controllers/
│   │   │   ├── authController.js      Register, login, refresh, profile
│   │   │   ├── documentController.js  Upload, browse, download, admin actions
│   │   │   └── paymentController.js   Paychangu mobile money integration
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── documents.js
│   │   │   ├── payments.js
│   │   │   ├── subjects.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   └── duplicateDetection.js  4-layer duplicate detection engine
│   │   └── utils/
│   │       └── jwt.js                 Token generation and verification
│   ├── package.json
│   └── .env.example        Copy to .env and fill in your credentials
└── frontend/               Next.js 14 (App Router) + Tailwind CSS
    ├── app/
    │   ├── layout.js               Root layout with AuthProvider
    │   ├── auth/
    │   │   ├── login/page.js       Login page (split-screen)
    │   │   └── register/page.js    Register page (2-step form)
    │   ├── browse/
    │   │   ├── page.js             Browse & search library
    │   │   └── [id]/page.js        Single document detail
    │   ├── upload/page.js          4-step upload wizard
    │   ├── dashboard/page.js       User dashboard (4 tabs)
    │   └── admin/page.js           Admin panel (7 tabs)
    ├── components/
    │   ├── auth/AuthLayout.js
    │   ├── documents/
    │   │   ├── DocumentCard.js
    │   │   ├── FilterSidebar.js
    │   │   └── AccessModal.js
    │   ├── layout/Navbar.js
    │   └── ui/
    │       ├── Button.js
    │       └── Input.js
    ├── lib/
    │   ├── api.js                  Axios instance + all API functions
    │   └── auth-context.js         Global auth state (Context + Provider)
    ├── styles/globals.css
    ├── landing.html                Standalone landing page
    ├── package.json
    └── .env.example                Copy to .env.local

```

---

## Quick start

### Step 1 — Set up the database

```bash
# Create a PostgreSQL database
createdb malawieduhub

# Run the schema (creates all 11 tables, views, and triggers)
psql -d malawieduhub -f database/schema.sql
```

### Step 2 — Start the backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env with your values (see required variables below)
npm run dev
# API runs on http://localhost:4000
# Health check: http://localhost:4000/health
```

### Step 3 — Start the frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
# App runs on http://localhost:3000
```

---

## Required environment variables

### Backend (.env)

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host (e.g. localhost) |
| `DB_PORT` | PostgreSQL port (default 5432) |
| `DB_NAME` | Database name (malawieduhub) |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Long random string for access tokens |
| `JWT_REFRESH_SECRET` | Long random string for refresh tokens |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 file storage |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | S3 region (e.g. af-south-1) |
| `AWS_S3_BUCKET` | S3 bucket name |
| `PAYCHANGU_SECRET_KEY` | Paychangu API key (Airtel Money / TNM Mpamba) |
| `AT_API_KEY` | Africa's Talking API key (SMS OTP) |
| `FRONTEND_URL` | Frontend URL for CORS (http://localhost:3000) |

### Frontend (.env.local)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (http://localhost:4000) |

---

## Access model (how users pay)

| Method | How it works |
|---|---|
| Upload pass | Upload 5–10 approved documents → earn a free 1-day pass automatically |
| Daily | MWK 300 via Airtel Money or TNM Mpamba |
| Weekly | MWK 1,000 |
| Monthly | MWK 2,500 |
| Pay per download | MWK 150–300 per individual document |

---

## Duplicate detection — 4 layers

Every uploaded document passes through these checks in order.
The upload is rejected at the first positive match.

| Layer | Method | Threshold |
|---|---|---|
| 1. Hash | SHA-256 of raw file bytes | Exact match = reject |
| 2. Metadata | Fuzzy title + level + subject + year (pg_trgm) | >90% similarity = reject |
| 3. Content | TF-IDF cosine similarity on extracted text | >90% = reject, 75–90% = flag |
| 4. Image | Perceptual hash (pHash) of first page | Hamming distance <10 = flag |

All blocked/flagged attempts are logged in the `duplicate_log` table with
the similarity score and detection layer. Admins can review and override.

---

## API endpoints summary

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/profile
```

### Documents
```
GET    /api/documents              Browse with filters
GET    /api/documents/:id          Single document
POST   /api/documents/upload       Upload (multipart/form-data)
GET    /api/documents/:id/download Signed S3 download URL

GET    /api/documents/admin/queue            Pending review queue  [admin]
GET    /api/documents/admin/duplicate-log    Duplicate log         [admin]
PATCH  /api/documents/admin/:id/approve      Approve document      [admin]
PATCH  /api/documents/admin/:id/reject       Reject with reason    [admin]
PATCH  /api/documents/admin/:id              Edit metadata         [admin]
```

### Payments
```
POST   /api/payments/subscribe         Start subscription (Airtel/TNM)
POST   /api/payments/per-download      Pay for single document
POST   /api/payments/webhook           Paychangu webhook (no auth)
GET    /api/payments/status/:id        Poll payment status
GET    /api/payments/admin/revenue     Revenue summary            [admin]
```

### Admin
```
GET    /api/admin/stats                Dashboard stats            [admin]
GET    /api/admin/users                All users                  [admin]
PATCH  /api/admin/users/:id/suspend    Suspend a user             [admin]
GET    /api/admin/settings             System settings            [admin]
PATCH  /api/admin/settings/:key        Update a setting           [admin]
```

---

## Database — tables

| Table | Purpose |
|---|---|
| `users` | All registered users with upload pass tracking |
| `subjects` | Subject lookup table (Mathematics, Biology, etc.) |
| `documents` | All uploaded documents with hashes and content vectors |
| `duplicate_log` | Every blocked/flagged upload attempt |
| `subscriptions` | Active and expired subscriptions |
| `payments` | All payment records (Airtel/TNM via Paychangu) |
| `downloads` | Every successful download (for history and abuse detection) |
| `document_views` | Page views (used for popularity sorting) |
| `admin_log` | Every admin action for accountability |
| `system_settings` | Key-value config editable from admin panel |
| `refresh_tokens` | JWT refresh tokens (with rotation) |

---

## Deployment

### Backend → Railway (free tier available)
1. Push the `backend/` folder to a GitHub repo
2. Create a project on railway.app and connect the repo
3. Add all environment variables in Railway's Variables tab
4. Railway auto-detects Node.js and runs `npm start`

### Frontend → Vercel (free tier)
1. Push the `frontend/` folder to a GitHub repo
2. Import the repo on vercel.com
3. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
4. Vercel auto-detects Next.js and deploys

### Database → Railway PostgreSQL or Supabase (both free to start)
1. Create a PostgreSQL instance on Railway or Supabase
2. Run `database/schema.sql` against the new database
3. Update your backend `.env` with the connection string

---

## Built with

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, DM Sans + DM Serif Display, Lucide icons
- **Backend:** Node.js, Express, PostgreSQL (pg), JWT, Multer, pdf-parse, Mammoth
- **Storage:** AWS S3 (signed URLs for secure downloads)
- **Payments:** Paychangu (Airtel Money + TNM Mpamba)
- **SMS:** Africa's Talking (OTP and notifications)
- **Duplicate detection:** SHA-256 hashing, pg_trgm fuzzy matching, TF-IDF cosine similarity, pHash

---

*MalawiEduHub — Malawi's Knowledge Library*
