# MalawiEduHub — Frontend (Next.js 14)

## Project structure

```
app/
├── layout.js              ← Root layout (AuthProvider + Toaster)
├── auth/
│   ├── login/page.js      ← Login page (split-screen)
│   └── register/page.js   ← Register page (2-step form)
├── browse/                ← (next: browse & search page)
├── upload/                ← (next: upload flow page)
├── dashboard/             ← (next: user dashboard)
└── admin/                 ← (next: admin panel)

components/
├── ui/
│   ├── Input.js           ← Reusable input field
│   └── Button.js          ← Reusable button (variants)
└── auth/
    └── AuthLayout.js      ← Split-screen auth layout

lib/
├── api.js                 ← Axios instance + all API functions
└── auth-context.js        ← Global auth state (Context + Provider)

styles/
└── globals.css            ← Tailwind + DM Fonts + base styles
```

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### 3. Run development server
```bash
npm run dev
```

Frontend runs on: http://localhost:3000

---

## Pages built so far

| Page | Route | Status |
|------|-------|--------|
| Login | `/auth/login` | ✅ Done |
| Register | `/auth/register` | ✅ Done |
| Browse library | `/browse` | 🔜 Next |
| Upload flow | `/upload` | 🔜 |
| User dashboard | `/dashboard` | 🔜 |
| Admin panel | `/admin` | 🔜 |

---

## Auth flow

1. User registers or logs in → JWT access token (15 min) + refresh token (30 days) stored in cookies
2. Every API request attaches the access token via axios interceptor
3. On 401 TOKEN_EXPIRED → auto-refreshes using refresh token
4. On refresh failure → clears session and redirects to `/auth/login`

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Set `NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app`
4. Deploy
