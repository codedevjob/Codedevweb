# CodeDev Backend – Setup & Deployment Guide

## 1. Supabase Setup

### Create the database tables
1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste the entire contents of `supabase-schema.sql` and click **Run**

### Create an admin user
1. Go to **Authentication → Users → Invite user**
2. Enter your admin email and set a password
3. Only users created here can log in to the admin dashboard

### Get your credentials
- **Project URL**: Settings → API → Project URL
- **Service Role Key**: Settings → API → `service_role` key (keep this secret)

---

## 2. Local Development

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
npm install
npm run dev
# API runs at http://localhost:3000
```

### Migrate existing JSON data (run once)
```bash
# From the backend/ directory
node migrate.js
```
This imports `data/jobs.json` and `data/referrals.json` into Supabase.
Existing records are skipped — no duplicates.

---

## 3. Deploy to Render

1. Push your repo to GitHub (push the `backend/` folder)
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables (Environment tab):
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FRONTEND_URL=https://codedev.com
   ```
6. Click **Deploy**
7. Copy the Render URL (e.g. `https://codedev-api.onrender.com`)

---

## 4. Connect Frontend to Backend

In `js/main.js` the `API_BASE` is already set:
```js
const API_BASE = window.CODEDEV_API || 'https://codedev-api.onrender.com';
```

Replace `https://codedev-api.onrender.com` with your actual Render URL,
or set `window.CODEDEV_API` in a `<script>` tag before loading `main.js`.

---

## 5. API Reference

### Public endpoints (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/jobs` | Active, non-expired jobs |
| GET | `/api/jobs/:slug` | Single job by slug |
| GET | `/api/referrals` | Active referrals |
| GET | `/api/stats` | Homepage statistics |

### Admin endpoints (Bearer token required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Login → returns JWT token |
| GET | `/api/admin/jobs` | All jobs (including drafts/expired) |
| POST | `/api/admin/jobs` | Create job |
| PUT | `/api/admin/jobs/:id` | Update job |
| DELETE | `/api/admin/jobs/:id` | Delete job |
| GET | `/api/admin/referrals` | All referrals |
| POST | `/api/admin/referrals` | Create referral |
| PUT | `/api/admin/referrals/:id` | Update referral |
| DELETE | `/api/admin/referrals/:id` | Delete referral |

---

## 6. How Publishing Works

1. Admin logs in at `/login/` → Supabase Auth returns a JWT
2. JWT is stored in `sessionStorage` (never localStorage, never a cookie)
3. Admin fills the Post Job form and clicks **Publish**
4. Frontend POSTs to `/api/admin/jobs` with `Authorization: Bearer <token>`
5. Backend verifies the token with Supabase, then inserts the row
6. Public `/api/jobs` immediately returns the new job — no Netlify redeploy needed

### Scheduled posts
- Set a future date/time in the Schedule field
- Status is saved as `scheduled` in Supabase
- The public API filters out scheduled posts whose `scheduled_date` is in the future
- Once that datetime passes, the post appears automatically on the next page load

### Automatic expiry
- Jobs with `expiry_date` in the past are excluded from public API responses
- They remain in Supabase and are visible in the admin dashboard under the Expired tab

---

## 7. Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side in the Express backend
- The frontend never sees this key
- All admin write operations require a valid Supabase JWT verified server-side
- Row Level Security (RLS) is enabled on both tables as a second layer
- Rate limiting: 200 requests per 15 minutes per IP
- CORS is restricted to `FRONTEND_URL` and localhost
