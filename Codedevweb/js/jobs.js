/* ============================================
   CodeDev - Jobs Page JavaScript
   ============================================ */

const JOBS_PER_PAGE = 9;
let allJobs = [];
let filtered = [];
let currentPage = 1;

async function init() {
  const grid = document.getElementById('jobsGrid');
  grid.innerHTML = `<div class="loading"><div class="spinner"></div> Loading jobs...</div>`;

  try {
    const raw = await getAllJobs();
    allJobs = raw.map(j => ({ ...j, companyLogo: j.company_logo, employmentType: j.employment_type, postedDate: j.posted_date, expiryDate: j.expiry_date, applicationUrl: j.application_url }));
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load jobs. Please try again later.</p></div>`;
    return;
  }
  // pre-fill filters from URL params (?q=, ?location=, ?company=)
  const params = new URLSearchParams(window.location.search);
  if (params.get('q'))        document.getElementById('searchInput').value    = params.get('q');
  if (params.get('location')) document.getElementById('locationFilter').value = params.get('location');
  if (params.get('company'))  document.getElementById('searchInput').value    = params.get('company');
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const location = document.getElementById('locationFilter').value.toLowerCase();
  const experience = document.getElementById('experienceFilter').value.toLowerCase();
  const type = document.getElementById('typeFilter').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;

  filtered = allJobs.filter(job => {
    const active = !isExpired(job.expiryDate);
    if (!active) return false;

    const searchMatch = !search ||
      job.title.toLowerCase().includes(search) ||
      job.company.toLowerCase().includes(search) ||
      job.location.toLowerCase().includes(search) ||
      (job.skills || []).some(s => s.toLowerCase().includes(search));

    const locationMatch = !location || job.location.toLowerCase().includes(location);
    const expLower = job.experience.toLowerCase();
    const expMatch = !experience || (
      experience === '0-1' ? (expLower.includes('0-1') || expLower.includes('fresher') || expLower.startsWith('0')) :
      experience === '5+'  ? (expLower.includes('5+') || expLower.includes('5 ')) :
      expLower.includes(experience)
    );
    const typeMatch = !type || (job.employmentType || '').toLowerCase().includes(type);

    return searchMatch && locationMatch && expMatch && typeMatch;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sort === 'oldest') return new Date(a.postedDate) - new Date(b.postedDate);
    return new Date(b.postedDate) - new Date(a.postedDate);
  });

  currentPage = 1;
  renderJobs();
}

function renderJobs() {
  const grid = document.getElementById('jobsGrid');
  const countEl = document.getElementById('jobCount');
  const paginationEl = document.getElementById('pagination');

  const total = filtered.length;
  const totalPages = Math.ceil(total / JOBS_PER_PAGE);
  const start = (currentPage - 1) * JOBS_PER_PAGE;
  const pageJobs = filtered.slice(start, start + JOBS_PER_PAGE);

  countEl.innerHTML = `Showing <strong>${pageJobs.length}</strong> of <strong>${total}</strong> active jobs`;

  if (total === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3>No jobs found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>`;
    paginationEl.innerHTML = '';
    return;
  }

  grid.innerHTML = pageJobs.map(job => buildJobCard(job, '../')).join('');
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `
    <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    </button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
    }
  }

  html += `
    <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>`;

  el.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderJobs();
  document.getElementById('jobsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('locationFilter').value = '';
  document.getElementById('experienceFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('sortSelect').value = 'latest';
  applyFilters();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  init();

  const debouncedFilter = debounce(applyFilters, 300);
  document.getElementById('searchInput').addEventListener('input', debouncedFilter);
  document.getElementById('locationFilter').addEventListener('change', applyFilters);
  document.getElementById('experienceFilter').addEventListener('change', applyFilters);
  document.getElementById('typeFilter').addEventListener('change', applyFilters);
  document.getElementById('sortSelect').addEventListener('change', applyFilters);
  document.getElementById('searchBtn').addEventListener('click', applyFilters);
  document.getElementById('clearBtn').addEventListener('click', clearFilters);

  // Enter key on search
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyFilters();
  });
});
