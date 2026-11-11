/* ============================================
   CodeDev - Referrals Page JavaScript
   ============================================ */

const REFS_PER_PAGE = 9;
let allRefs = [];
let filteredRefs = [];
let currentRefPage = 1;

async function initReferrals() {
  const grid = document.getElementById('refGrid');
  try {
    const raw = await getAllReferrals();
    allRefs = raw.map(r => ({
      ...r,
      companyLogo: r.company_logo,
      postedDate: r.posted_date,
      referralDeadline: r.referral_deadline,
      applicationUrl: r.application_url
    }));
  } catch(e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Failed to load referrals. Please try again later.</p></div>`;
    return;
  }
  applyRefSort();
}

function applyRefSort() {
  const sort = document.getElementById('refSort').value;
  filteredRefs = allRefs.filter(r => !isExpired(r.referralDeadline));

  filteredRefs.sort((a, b) => {
    if (sort === 'oldest') return new Date(a.postedDate) - new Date(b.postedDate);
    if (sort === 'deadline') return new Date(a.referralDeadline) - new Date(b.referralDeadline);
    return new Date(b.postedDate) - new Date(a.postedDate);
  });

  currentRefPage = 1;
  renderReferrals();
}

function renderReferrals() {
  const grid = document.getElementById('refGrid');
  const countEl = document.getElementById('refCount');
  const paginationEl = document.getElementById('refPagination');

  const total = filteredRefs.length;
  const totalPages = Math.ceil(total / REFS_PER_PAGE);
  const start = (currentRefPage - 1) * REFS_PER_PAGE;
  const pageRefs = filteredRefs.slice(start, start + REFS_PER_PAGE);

  countEl.innerHTML = `Showing <strong>${pageRefs.length}</strong> of <strong>${total}</strong> active referrals`;

  if (total === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <h3>No active referrals right now</h3>
        <p>Check back soon or <a href="/jobs/">browse open jobs</a>.</p>
      </div>`;
    paginationEl.innerHTML = '';
    return;
  }

  grid.innerHTML = pageRefs.map(r => buildRefCard(r)).join('');
  renderRefPagination(totalPages);
}

function buildRefCard(r) {
  const days = daysLeft(r.referralDeadline);
  const urgent = days !== null && days <= 5;
  const skills = (r.skills || []).slice(0, 4);
  const extra = (r.skills || []).length - 4;
  const salary = r.salary && r.salary !== 'Not Disclosed' ? r.salary : null;

  return `
    <article class="ref-card${urgent ? ' urgent-card' : ''}">
      <div class="ref-card-top">
        <div class="ref-card-logo-title">
          ${getLogoHTML(r.companyLogo, r.company, 48)}
          <div>
            <div class="ref-card-company">${r.company}</div>
            <div class="ref-card-title">${r.title}</div>
          </div>
        </div>
        <div class="ref-card-badges">
          <span class="badge-ref">🤝 Referral</span>
          ${urgent ? `<span class="badge badge-urgency">⏰ ${days === 0 ? 'Last day!' : days + 'd left'}</span>` : ''}
        </div>
      </div>

      <div class="ref-card-meta">
        <span class="ref-card-meta-item">${iconLocation()}<span>${r.location}</span></span>
        <span class="ref-card-meta-item">${iconBriefcase()}<span>${r.experience}</span></span>
        ${salary ? `<span class="ref-card-meta-item">${iconMoney()}<span>₹ ${salary}</span></span>` : ''}
      </div>

      ${skills.length ? `
      <div class="ref-card-skills">
        ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        ${extra > 0 ? `<span class="skill-tag skill-tag-more">+${extra} more</span>` : ''}
      </div>` : ''}

      <div class="ref-card-footer">
        <span class="ref-deadline${urgent ? ' urgent' : ''}">
          ${iconCalendar()} Deadline: ${formatDate(r.referralDeadline)}
        </span>
        <a href="${r.applicationUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-refer" ${!r.applicationUrl ? 'style="opacity:.45;pointer-events:none"' : ''}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          Apply via Referral
        </a>
      </div>
    </article>`;
}

function renderRefPagination(totalPages) {
  const el = document.getElementById('refPagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="goToRefPage(${currentRefPage - 1})" ${currentRefPage === 1 ? 'disabled' : ''} aria-label="Previous page">
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
  </button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentRefPage) <= 1) {
      html += `<button class="page-btn${i === currentRefPage ? ' active' : ''}" onclick="goToRefPage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentRefPage) === 2) {
      html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
    }
  }

  html += `<button class="page-btn" onclick="goToRefPage(${currentRefPage + 1})" ${currentRefPage === totalPages ? 'disabled' : ''} aria-label="Next page">
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
  </button>`;

  el.innerHTML = html;
}

function goToRefPage(page) {
  const totalPages = Math.ceil(filteredRefs.length / REFS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentRefPage = page;
  renderReferrals();
  document.getElementById('refGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', () => {
  initReferrals();
  document.getElementById('refSort').addEventListener('change', applyRefSort);
});
