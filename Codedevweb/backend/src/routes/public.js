const router = require('express').Router();
const supabase = require('../supabase');

const now = () => new Date().toISOString();

// GET /api/health
router.get('/health', (req, res) => res.json({ ok: true, ts: now() }));

// GET /api/jobs — active, non-expired, scheduled date passed
router.get('/jobs', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .or(`scheduled_date.is.null,scheduled_date.lte.${now()}`)
      .order('posted_date', { ascending: false });
    if (error) throw error;
    res.json(data.map(toFrontend));
  } catch (e) { next(e); }
});

// GET /api/jobs/:slug
router.get('/jobs/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'active')
      .single();
    if (error || !data) return res.status(404).json({ error: 'Job not found' });
    res.json(toFrontend(data));
  } catch (e) { next(e); }
});

// GET /api/referrals — active, non-expired
router.get('/referrals', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('status', 'active')
      .or(`referral_deadline.is.null,referral_deadline.gte.${new Date().toISOString().split('T')[0]}`)
      .or(`scheduled_date.is.null,scheduled_date.lte.${now()}`)
      .order('posted_date', { ascending: false });
    if (error) throw error;
    res.json(data.map(refToFrontend));
  } catch (e) { next(e); }
});

// GET /api/stats
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [{ count: activeJobs }, { count: referrals }, { data: companies }] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('expiry_date', today),
      supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('jobs').select('company')
    ]);
    const uniqueCompanies = new Set((companies || []).map(j => j.company)).size;
    res.json({ activeJobs, referrals, companies: uniqueCompanies });
  } catch (e) { next(e); }
});

// Map DB snake_case → frontend camelCase
function toFrontend(j) {
  return {
    id: j.id,
    slug: j.slug,
    company: j.company,
    companyLogo: j.company_logo,
    title: j.title,
    location: j.location,
    experience: j.experience,
    employmentType: j.employment_type,
    skills: j.skills || [],
    salary: j.salary,
    postedDate: j.posted_date,
    expiryDate: j.expiry_date,
    description: j.description,
    responsibilities: j.responsibilities || [],
    eligibility: j.eligibility || [],
    education: j.education,
    applicationUrl: j.application_url,
    featured: j.featured,
    status: j.status
  };
}

function refToFrontend(r) {
  return {
    id: r.id,
    slug: r.slug,
    company: r.company,
    companyLogo: r.company_logo,
    title: r.title,
    location: r.location,
    experience: r.experience,
    skills: r.skills || [],
    salary: r.salary,
    description: r.description,
    eligibility: r.eligibility || [],
    referralDeadline: r.referral_deadline,
    applicationUrl: r.referral_url,
    postedDate: r.posted_date,
    status: r.status,
    postType: 'referral'
  };
}

module.exports = router;
module.exports.toFrontend = toFrontend;
module.exports.refToFrontend = refToFrontend;
