// migrate.js — run once: node migrate.js
// Imports data/jobs.json and data/referrals.json into Supabase.
// Skips existing records (no duplicates). Preserves all IDs and slugs.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateJobs() {
  const jobsPath = path.join(__dirname, '..', 'data', 'jobs.json');
  if (!fs.existsSync(jobsPath)) { console.log('data/jobs.json not found, skipping.'); return; }

  fs.copyFileSync(jobsPath, jobsPath + '.backup');
  console.log('✅ Backup saved: data/jobs.json.backup');

  const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
  console.log(`Found ${jobs.length} jobs to migrate`);

  const { data: existing } = await supabase.from('jobs').select('slug');
  const existingSlugs = new Set((existing || []).map(j => j.slug));

  const toInsert = jobs
    .filter(j => !existingSlugs.has(j.slug))
    .map(j => ({
      id:               j.id,
      slug:             j.slug,
      company:          j.company,
      company_logo:     (j.companyLogo || '').replace(/^\.\.\//, '/'),
      title:            j.title,
      location:         j.location,
      experience:       j.experience,
      employment_type:  j.employmentType || 'Full Time',
      skills:           j.skills || [],
      salary:           j.salary || 'Not Disclosed',
      posted_date:      j.postedDate,
      expiry_date:      j.expiryDate,
      description:      j.description || '',
      responsibilities: j.responsibilities || [],
      eligibility:      j.eligibility || [],
      education:        j.education || '',
      application_url:  j.applicationUrl || '',
      featured:         j.featured || false,
      status:           j.status || 'active',
      scheduled_date:   j.scheduledDate || null
    }));

  if (!toInsert.length) { console.log('No new jobs to insert (all already exist).'); return; }

  const { error } = await supabase.from('jobs').insert(toInsert);
  if (error) { console.error('Jobs migration failed:', error.message); process.exit(1); }
  console.log(`✅ Migrated ${toInsert.length} jobs. Skipped ${jobs.length - toInsert.length}.`);
}

async function migrateReferrals() {
  const refPath = path.join(__dirname, '..', 'data', 'referrals.json');
  if (!fs.existsSync(refPath)) { console.log('data/referrals.json not found, skipping.'); return; }

  const refs = JSON.parse(fs.readFileSync(refPath, 'utf8'));
  if (!refs.length) { console.log('No referrals to migrate.'); return; }
  console.log(`Found ${refs.length} referrals to migrate`);

  const { data: existing } = await supabase.from('referrals').select('slug');
  const existingSlugs = new Set((existing || []).map(r => r.slug));

  const toInsert = refs
    .filter(r => !existingSlugs.has(r.slug))
    .map(r => ({
      id:                r.id,
      slug:              r.slug,
      company:           r.company,
      company_logo:      (r.companyLogo || '').replace(/^\.\.\//, '/'),
      title:             r.title,
      location:          r.location,
      experience:        r.experience,
      skills:            r.skills || [],
      salary:            r.salary || 'Not Disclosed',
      description:       r.description || '',
      eligibility:       r.eligibility || [],
      referral_url:      r.applicationUrl || '',
      referral_deadline: r.referralDeadline || null,
      posted_date:       r.postedDate,
      status:            r.status || 'active',
      scheduled_date:    r.scheduledDate || null
    }));

  if (!toInsert.length) { console.log('No new referrals to insert (all already exist).'); return; }

  const { error } = await supabase.from('referrals').insert(toInsert);
  if (error) { console.error('Referrals migration failed:', error.message); process.exit(1); }
  console.log(`✅ Migrated ${toInsert.length} referrals. Skipped ${refs.length - toInsert.length}.`);
}

async function migrate() {
  await migrateJobs();
  await migrateReferrals();
}

migrate().catch(e => { console.error(e); process.exit(1); });
