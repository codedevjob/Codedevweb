# CodeDev – IT Job & Referral Portal

A complete, professional, static IT job portal built with HTML5, CSS3 and Vanilla JavaScript. Deployable to Netlify for free.

---

## Project Structure

```
CodeDev/
├── index.html              ← Homepage
├── _redirects              ← Netlify URL routing
├── sitemap.xml             ← SEO sitemap
├── robots.txt              ← Search engine rules
│
├── jobs/
│   └── index.html          ← Job listings page
├── job/
│   └── index.html          ← Job detail page (slug-based)
├── referrals/
│   └── index.html          ← Referrals page
├── about/
│   └── index.html          ← About Us
├── contact/
│   └── index.html          ← Contact Us
├── privacy/
│   └── index.html          ← Privacy Policy
├── disclaimer/
│   └── index.html          ← Disclaimer
├── admin/
│   └── index.html          ← Admin Dashboard (read-only)
│
├── data/
│   ├── jobs.json           ← All job data
│   └── referrals.json      ← All referral data
│
├── css/
│   ├── style.css           ← Global styles
│   ├── jobs.css            ← Jobs page styles
│   ├── job-details.css     ← Job detail page styles
│   ├── referrals.css       ← Referrals page styles
│   ├── dashboard.css       ← Admin dashboard styles
│   └── responsive.css      ← Mobile responsive styles
│
├── js/
│   ├── main.js             ← Shared utilities & card builders
│   ├── jobs.js             ← Jobs listing logic
│   ├── job-details.js      ← Job detail page logic
│   ├── referrals.js        ← Referrals page logic
│   └── dashboard.js        ← Admin dashboard logic
│
└── images/
    ├── logo.jpeg           ← CodeDev logo
    └── companies/          ← Company SVG logos
```

---

## How to Add a New Job

Edit `data/jobs.json` and add a new object to the array:

```json
{
  "id": "JOB011",
  "slug": "company-job-title",
  "company": "Company Name",
  "companyLogo": "../images/companies/logo.svg",
  "title": "Job Title",
  "location": "City",
  "experience": "X-Y Years",
  "employmentType": "Full Time",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "salary": "X-Y LPA",
  "postedDate": "2025-07-15",
  "expiryDate": "2025-09-15",
  "description": "Full job description here.",
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "eligibility": ["Requirement 1", "Requirement 2"],
  "education": "B.E / B.Tech in Computer Science",
  "applicationUrl": "https://careers.company.com/apply",
  "status": "active",
  "featured": false
}
```

**Date format:** `YYYY-MM-DD` (e.g. `2025-08-30`)

Jobs past their `expiryDate` are automatically hidden from active listings.

---

## How to Add a New Referral

Edit `data/referrals.json` and add a new object:

```json
{
  "id": "REF007",
  "slug": "company-role-referral",
  "company": "Company Name",
  "companyLogo": "../images/companies/logo.svg",
  "title": "Job Title",
  "location": "City",
  "experience": "X-Y Years",
  "skills": ["Skill1", "Skill2"],
  "salary": "X-Y LPA",
  "description": "Referral description.",
  "eligibility": ["Requirement 1"],
  "referralDeadline": "2025-09-01",
  "applicationUrl": "https://careers.company.com",
  "status": "active",
  "postedDate": "2025-07-15"
}
```

---

## Running Locally

Since the site uses `fetch()` to load JSON, you need a local server (not `file://`).

**Option 1 – VS Code Live Server:**
- Install "Live Server" extension
- Right-click `index.html` → Open with Live Server

**Option 2 – Python:**
```bash
cd CodeDev
python -m http.server 8000
# Open http://localhost:8000
```

**Option 3 – Node.js:**
```bash
npx serve .
```

---

## Deploying to Netlify

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "Initial CodeDev deployment"
git remote add origin https://github.com/yourusername/codedev.git
git push -u origin main
```

### Step 2 – Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and select your repository
4. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `.` (root)
5. Click **Deploy site**

### Step 3 – Connect Your Domain (codedev.com)
1. In Netlify dashboard → **Domain settings**
2. Click **Add custom domain** → enter `codedev.com`
3. Netlify will provide nameservers — update them at your domain registrar
4. HTTPS is automatically provisioned via Let's Encrypt (free)

### Step 4 – Auto-Deploy
Every time you push to GitHub, Netlify automatically redeploys. To add a new job:
1. Edit `data/jobs.json`
2. Commit and push to GitHub
3. Netlify redeploys in ~30 seconds

---

## SEO Notes

- Each job has a unique URL: `codedev.com/job/slug/`
- The `_redirects` file routes `/job/*` to `/job/index.html` with a 200 rewrite
- JavaScript dynamically updates `<title>` and `<meta description>` per job
- **Limitation:** Client-side rendered job pages may not be fully indexed by all crawlers. For full SEO, consider pre-rendering job pages as static HTML using a build script or SSG like Eleventy.
- `sitemap.xml` lists all job URLs for Google Search Console submission

---

## Admin Dashboard

Access at: `codedev.com/admin/`

- Read-only dashboard powered by live JSON data
- Shows active jobs, expired jobs, referrals, analytics
- No authentication (static read-only — no sensitive data exposed)
- To add write access, integrate [Decap CMS](https://decapcms.org/) with your GitHub repo

---

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- JSON data files (no database)
- Netlify (free static hosting)
- Google Fonts (Inter)
- No frameworks, no npm, no build tools

---

© 2026 CodeDev
