/* ============================================
   CodeDev - Main JavaScript
   Shared utilities, navigation, footer
   ============================================ */

// ---- Supabase Config ----
const SB_URL = 'https://xavvrnmahtakttdbwxsk.supabase.co';
const SB_KEY = 'sb_publishable_OAc0TJq365enaKWCi7JgoA_HrV9Nt6K';
const SB_HEADERS = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

// ---- Branding: load logo + social links from Supabase site_settings ----
(async function applyBranding() {
  const CACHE_KEY = 'cd_branding';

  function applySettings(s) {
    if (s.logo_url) {
      document.querySelectorAll('.nav-logo-img').forEach(img => { img.src = s.logo_url; });
      // Also update admin sidebar logo if present
      const sidebarLogo = document.getElementById('sidebar-logo-img');
      if (sidebarLogo) sidebarLogo.src = s.logo_url;
    }
    const map = { wa: s.wa_url, instagram: s.instagram, linkedin: s.linkedin };
    Object.entries(map).forEach(([key, url]) => {
      if (!url) return;
      document.querySelectorAll(`[data-social="${key}"]`).forEach(el => { el.href = url; });
    });
    if (s.email) {
      document.querySelectorAll('[data-social="email"]').forEach(el => { el.href = 'mailto:' + s.email; });
    }
  }

  // Apply cached branding instantly (no flash)
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) applySettings(JSON.parse(cached));
  } catch(e) {}

  // Fetch fresh from Supabase and update
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/site_settings?key=in.(logo_url,site_name,wa_url,instagram,linkedin,email)&select=key,value`,
      { headers: { 'apikey': SB_KEY } }
    );
    if (!res.ok) return;
    const rows = await res.json();
    const s = {};
    rows.forEach(r => { s[r.key] = r.value; });
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(s));
    applySettings(s);
  } catch(e) { /* silently fall back to defaults */ }
})();

// ---- Navigation ----
(function initNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (!hamburger || !mobileNav) return;

  // Backdrop overlay
  const backdrop = document.createElement('div');
  backdrop.id = 'navBackdrop';
  document.body.appendChild(backdrop);

  function openNav() {
    mobileNav.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', true);
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileNav.classList.contains('open') ? closeNav() : openNav();
  });

  backdrop.addEventListener('click', closeNav);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      closeNav();
    }
  });

  // Set active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === '/' && (path === '/' || path === '/index.html')) {
      link.classList.add('active');
    } else if (href !== '/' && path.startsWith(href)) {
      link.classList.add('active');
    }
  });
})();

// ---- Toast Notification ----
function showToast(message, type = 'success', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      ${type === 'success'
        ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>'}
    </svg>
    ${message}
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ---- Date Utilities ----
function isExpired(dateStr) {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  expiry.setHours(23, 59, 59, 999);
  return new Date() > expiry;
}

function isNew(dateStr, days = 7) {
  if (!dateStr) return false;
  const posted = new Date(dateStr);
  const diff = (new Date() - posted) / (1000 * 60 * 60 * 24);
  return diff <= days;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

async function sbFetch(table, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Failed to load ${table}`);
  return res.json();
}

// ---- Get All Jobs from Supabase ----
async function getAllJobs() {
  return sbFetch('jobs', 'order=posted_date.desc');
}

// ---- Get All Referrals from Supabase ----
async function getAllReferrals() {
  return sbFetch('referrals', 'order=posted_date.desc');
}

// ---- Fetch JSON (fallback for static files) ----
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

// ---- Company Logo Fallback ----
function getLogoHTML(logo, company, size = 52) {
  const initial = (company || '?')[0].toUpperCase();
  // Normalise logo path: strip leading ../ so it always works from any page depth
  const src = (logo || '').replace(/^(\.\.\/)+/, '/');
  return `
    <div class="company-logo-wrap" style="width:${size}px;height:${size}px" aria-label="${company} logo">
      <img src="${src}" alt="${company}" loading="lazy"
        onerror="this.parentElement.innerHTML='<span aria-hidden=\\'true\\'>${initial}</span>'">
    </div>`;
}

// ---- Build Job Card HTML ----
function buildJobCard(job, basePath = '') {
  const expired  = isExpired(job.expiryDate);
  const newJob   = isNew(job.postedDate);
  const left     = daysLeft(job.expiryDate);
  const urgent   = !expired && left !== null && left <= 5;
  const skills   = (job.skills || []).slice(0, 4);
  const extra    = (job.skills || []).length - 4;
  const salary   = job.salary && job.salary !== 'Not Disclosed' ? job.salary : null;

  const urgencyBadge = urgent
    ? `<span class="badge-urgency">⏰ ${left === 0 ? 'Last day!' : `${left}d left`}</span>` : '';

  const detailUrl = `${basePath}job/?slug=${job.slug}`;

  return `
    <article class="job-card${expired ? ' expired-card' : ''}${urgent ? ' urgent-card' : ''}" data-id="${job.id}" onclick="window.location.href='${detailUrl}'" style="cursor:pointer">

      <!-- TOP: logo + badges -->
      <div class="jc-top">
        <div class="jc-logo-wrap">
          ${getLogoHTML(job.companyLogo, job.company, 48)}
        </div>
        <div class="jc-badges">
          ${expired  ? '<span class="badge badge-expired">Expired</span>' : ''}
          ${!expired && newJob ? '<span class="badge badge-new">✦ New</span>' : ''}
          ${job.featured && !expired ? '<span class="badge badge-featured">⭐ Featured</span>' : ''}
          ${urgencyBadge}
        </div>
      </div>

      <!-- BODY -->
      <div class="jc-body">
        <p class="jc-company">${job.company}</p>
        <h3 class="jc-title">${job.title}</h3>

        <div class="jc-meta">
          <span class="jc-meta-item">${iconLocation()}<span>${job.location}</span></span>
          <span class="jc-meta-item">${iconBriefcase()}<span>${job.experience}</span></span>
          ${salary ? `<span class="jc-meta-item jc-salary">${iconMoney()}<span>₹ ${salary}</span></span>` : ''}
          <span class="jc-meta-item"><span class="badge badge-type">${job.employmentType || 'Full Time'}</span></span>
        </div>

        ${skills.length ? `
        <div class="jc-skills">
          ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          ${extra > 0 ? `<span class="skill-tag skill-tag-more">+${extra} more</span>` : ''}
        </div>` : ''}
      </div>

      <!-- FOOTER -->
      <div class="jc-footer">
        <span class="jc-date">${iconCalendar()} ${formatDate(job.postedDate)}</span>
        <div class="jc-actions">
          <button class="btn btn-ghost btn-sm jc-share-btn" onclick="shareJob(event,'${job.slug}','${job.title.replace(/'/g,"\\'").replace(/"/g,'&quot;')}','${job.company.replace(/'/g,"\\'").replace(/"/g,'&quot;')}');event.stopPropagation()" aria-label="Share ${job.title}">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          </button>
          <a href="${detailUrl}" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">View Job</a>
          ${!expired && job.applicationUrl
            ? `<a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-apply" onclick="event.stopPropagation()">Apply Now →</a>`
            : `<button class="btn btn-apply" style="opacity:.4;cursor:not-allowed" disabled>Expired</button>`
          }
        </div>
      </div>
    </article>`;
}


// ---- SVG Icons ----
function iconLocation() {
  return `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;
}
function iconBriefcase() {
  return `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;
}
function iconCalendar() {
  return `<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
}
function iconMoney() {
  return `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
}

// ---- Copy to Clipboard ----
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Link copied to clipboard!', 'success');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Link copied!', 'success');
  }
}

// ---- Share Job (card) ----
function shareJob(e, slug, title, company) {
  e.preventDefault();
  e.stopPropagation();
  document.querySelectorAll('.card-share-popup').forEach(p => p.remove());

  const url = window.location.origin + '/job/?slug=' + slug;
  const text = encodeURIComponent(title + ' at ' + company + ' – Apply on CodeDev');
  const encUrl = encodeURIComponent(url);

  const popup = document.createElement('div');
  popup.className = 'card-share-popup';
  popup.innerHTML = `
    <a href="https://wa.me/?text=${text}%20${encUrl}" target="_blank" rel="noopener noreferrer">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#15803d"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      WhatsApp
    </a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}" target="_blank" rel="noopener noreferrer">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#1d4ed8"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      LinkedIn
    </a>
    <button class="copy-btn">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      <span class="copy-lbl">Copy Link</span>
    </button>`;

  // Position popup relative to the card, not the button
  const btn = e.target.closest('button');
  const card = btn.closest('.job-card');
  card.style.position = 'relative';
  card.appendChild(popup);

  // Wire up copy button with the correct URL for this job
  popup.querySelector('.copy-btn').addEventListener('click', (ev) => {
    ev.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      const lbl = popup.querySelector('.copy-lbl');
      lbl.textContent = 'Copied!';
      setTimeout(() => { lbl.textContent = 'Copy Link'; }, 2000);
    }).catch(() => copyToClipboard(url));
  });

  setTimeout(() => document.addEventListener('click', function h(ev) {
    if (!popup.contains(ev.target)) { popup.remove(); document.removeEventListener('click', h); }
  }), 0);
}

// ---- Debounce ----
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
