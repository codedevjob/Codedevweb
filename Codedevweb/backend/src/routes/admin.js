const router = require('express').Router();
const supabase = require('../supabase');
const requireAuth = require('../middleware/auth');
const { toFrontend, refToFrontend } = require('./public');

// ── LOGIN — public, no auth required ────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: data.session.access_token, email: data.user.email });
  } catch (e) { next(e); }
});

// All routes below require a valid Supabase session token
router.use(requireAuth);

// ── JOBS ──────────────────────────────────────────────────────────────────────

// GET /api/admin/jobs — all jobs including expired/scheduled
router.get('/jobs', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('jobs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(toFrontend));
  } catch (e) { next(e); }
});

// POST /api/admin/jobs
router.post('/jobs', async (req, res, next) => {
  try {
    const job = toDB(req.body);
    validate(job, ['title', 'company', 'location', 'experience', 'expiry_date', 'application_url', 'description']);
    const { data, error } = await supabase.from('jobs').insert(job).select().single();
    if (error) throw error;
    res.status(201).json(toFrontend(data));
  } catch (e) { next(e); }
});

// PUT /api/admin/jobs/:id
router.put('/jobs/:id', async (req, res, next) => {
  try {
    const job = toDB(req.body);
    const { data, error } = await supabase
      .from('jobs').update({ ...job, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Job not found' });
    res.json(toFrontend(data));
  } catch (e) { next(e); }
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── REFERRALS ─────────────────────────────────────────────────────────────────

// GET /api/admin/referrals
router.get('/referrals', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('referrals').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(refToFrontend));
  } catch (e) { next(e); }
});

// POST /api/admin/referrals
router.post('/referrals', async (req, res, next) => {
  try {
    const ref = toRefDB(req.body);
    validate(ref, ['title', 'company', 'location', 'experience', 'referral_url', 'description']);
    const { data, error } = await supabase.from('referrals').insert(ref).select().single();
    if (error) throw error;
    res.status(201).json(refToFrontend(data));
  } catch (e) { next(e); }
});

// PUT /api/admin/referrals/:id
router.put('/referrals/:id', async (req, res, next) => {
  try {
    const ref = toRefDB(req.body);
    const { data, error } = await supabase
      .from('referrals').update({ ...ref, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Referral not found' });
    res.json(refToFrontend(data));
  } catch (e) { next(e); }
});

// DELETE /api/admin/referrals/:id
router.delete('/referrals/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('referrals').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

function toDB(b) {
  const slug = b.slug || (b.company + '-' + b.title)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: b.id || undefined,
    slug,
    company: b.company,
    company_logo: b.companyLogo || '/images/companies/default.svg',
    title: b.title,
    location: b.location,
    experience: b.experience,
    employment_type: b.employmentType || 'Full Time',
    skills: Array.isArray(b.skills) ? b.skills : (b.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    salary: b.salary || 'Not Disclosed',
    posted_date: b.postedDate || new Date().toISOString().split('T')[0],
    expiry_date: b.expiryDate,
    description: b.description,
    responsibilities: b.responsibilities || [],
    eligibility: b.eligibility || [],
    education: b.education || '',
    application_url: b.applicationUrl,
    featured: b.featured || false,
    status: b.status || 'active',
    scheduled_date: b.scheduledDate || null
  };
}

function toRefDB(b) {
  const slug = b.slug || (b.company + '-' + b.title)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: b.id || undefined,
    slug,
    company: b.company,
    company_logo: b.companyLogo || '/images/companies/default.svg',
    title: b.title,
    location: b.location,
    experience: b.experience,
    skills: Array.isArray(b.skills) ? b.skills : (b.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    salary: b.salary || 'Not Disclosed',
    description: b.description,
    eligibility: b.eligibility || [],
    referral_url: b.applicationUrl,
    referral_deadline: b.referralDeadline || null,
    posted_date: b.postedDate || new Date().toISOString().split('T')[0],
    status: b.status || 'active',
    scheduled_date: b.scheduledDate || null
  };
}

function validate(obj, fields) {
  for (const f of fields) {
    if (!obj[f]) throw Object.assign(new Error(`Missing required field: ${f}`), { status: 400 });
  }
}

module.exports = router;
