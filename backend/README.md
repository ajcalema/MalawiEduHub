# MalawiEduHub — Backend API

Node.js + Express REST API for the MalawiEduHub educational resource platform.

---

## Project structure

```
src/
├── server.js                   ← Entry point
├── config/
│   ├── db.js                   ← PostgreSQL connection pool
│   └── storage.js              ← AWS S3 helpers + signed URLs
├── middleware/
│   └── auth.js                 ← JWT auth, role checks, access checks
├── controllers/
│   ├── authController.js       ← Register, login, refresh, profile
│   ├── documentController.js   ← Upload, browse, download, admin actions
│   └── paymentController.js    ← Paychangu integration, webhook, revenue
├── services/
│   └── duplicateDetection.js   ← 4-layer duplicate detection engine
├── routes/
│   ├── auth.js
│   ├── documents.js
│   ├── payments.js
│   ├── subjects.js
│   └── admin.js
└── utils/
    └── jwt.js                  ← Token generation and verification
```

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your database, S3, and Paychangu credentials
```

### 3. Set up PostgreSQL database
```bash
# Create database
createdb malawieduhub

# Run schema (from root of project)
psql -d malawieduhub -f ../malawieduhub-schema.sql
```

### 4. Start the server
```bash
# Development (auto-restarts on change)
npm run dev

# Production
npm start
```

Server runs on: http://localhost:4000

---

## API endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | None |
| POST | `/api/auth/login` | Login | None |
| POST | `/api/auth/refresh` | Refresh access token | None |
| POST | `/api/auth/logout` | Revoke refresh token | None |
| GET  | `/api/auth/profile` | Get own profile + subscription | Required |

### Documents
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET  | `/api/documents` | Browse library (filters: subject, level, doc_type, year, search, sort) | Optional |
| GET  | `/api/documents/:id` | Get single document | Optional |
| POST | `/api/documents/upload` | Upload document (multipart/form-data) | Required |
| GET  | `/api/documents/:id/download` | Get signed download URL | Required + Access |

### Admin (documents)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET  | `/api/documents/admin/queue` | Pending review queue | Admin |
| GET  | `/api/documents/admin/duplicate-log` | All blocked/flagged uploads | Admin |
| PATCH | `/api/documents/admin/:id/approve` | Approve document | Admin |
| PATCH | `/api/documents/admin/:id/reject` | Reject with reason | Admin |
| PATCH | `/api/documents/admin/:id` | Edit metadata | Admin |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/subscribe` | Start subscription payment | Required |
| POST | `/api/payments/per-download` | Pay for one document | Required |
| POST | `/api/payments/webhook` | Paychangu webhook (no auth) | None |
| GET  | `/api/payments/status/:id` | Poll payment status | Required |
| GET  | `/api/payments/admin/revenue` | Revenue summary | Admin |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | All subjects with document counts |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/suspend` | Suspend a user |
| GET | `/api/admin/settings` | System settings |
| PATCH | `/api/admin/settings/:key` | Update a setting |

---

## Upload request format

```
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
  file        (required) PDF/DOCX/PPTX file
  title       (required) Document title
  subject_id  (required) Subject ID (1–12)
  level       (required) primary | jce | msce | university
  doc_type    (required) past_paper | notes | textbook | marking_scheme | revision_guide
  year        (required) e.g. 2023
  description (optional)
```

---

## Duplicate detection responses

When a duplicate is detected the API returns HTTP 409:

```json
{
  "error": "duplicate_detected",
  "message": "This document already exists in our library.",
  "matched_document": { "id": "...", "title": "MSCE Biology Paper 1 2023" },
  "layer": "hash",
  "similarity_score": 100
}
```

Possible layers: `hash` | `metadata` | `content` | `image`

---

## Deployment (Railway + Vercel)

### Backend on Railway
1. Push this folder to GitHub
2. Create a new project on railway.app
3. Connect your GitHub repo
4. Add all `.env` variables in Railway's environment tab
5. Railway auto-detects Node.js and runs `npm start`

### Frontend on Vercel
1. The Next.js frontend goes in a separate repo
2. Set `NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app` in Vercel env vars

---

## Environment variables needed

See `.env.example` for the full list. Minimum to get started locally:
- `DB_*` — PostgreSQL connection
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — any long random strings
- `AWS_*` and `AWS_S3_BUCKET` — for file storage
- `PAYCHANGU_SECRET_KEY` — for payments
