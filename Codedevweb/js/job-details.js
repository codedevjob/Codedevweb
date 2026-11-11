/* ============================================
   CodeDev - Job Details Page JavaScript
   ============================================ */

async function init() {
  const slug = getSlugFromURL();
  if (!slug) { showError('Invalid job URL.'); return; }

  try {
    const [jobArr, rawJobs] = await Promise.all([
      sbFetch('jobs', `slug=eq.${slug}`),
      getAllJobs()
    ]);
    const raw = jobArr && jobArr[0];
    if (!raw) { showError('Job not found.'); return; }
    const job = { ...raw, companyLogo: raw.company_logo, employmentType: raw.employment_type, postedDate: raw.posted_date, expiryDate: raw.expiry_date, applicationUrl: raw.application_url };
    const jobs = rawJobs.map(j => ({ ...j, companyLogo: j.company_logo, employmentType: j.employment_type, postedDate: j.posted_date, expiryDate: j.expiry_date, applicationUrl: j.application_url }));

    renderJobDetail(job);
    renderRelatedJobs(jobs, job);
    updateSEO(job);
  } catch (e) {
    showError('Failed to load job details.');
  }
}

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('slug')) return params.get('slug');
  const path = window.location.pathname.replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'job') return parts[1];
  return null;
}

function renderJobDetail(job) {
  const expired = isExpired(job.expiryDate);
  const newJob = isNew(job.postedDate);
  const days = daysLeft(job.expiryDate);

  // Header
  document.getElementById('jobDetailHeader').innerHTML = `
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        <a href="/jobs/">Jobs</a>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span>${job.title}</span>
      </nav>
      <div class="job-detail-header-inner">
        ${getLogoHTML(job.companyLogo, job.company, 80)}
        <div class="job-detail-info">
          <p class="company-name">${job.company}</p>
          <h1>${job.title}</h1>
          <div class="job-detail-meta">
            <span class="job-detail-meta-item">${iconLocation()} <strong>${job.location}</strong></span>
            <span class="job-detail-meta-item">${iconBriefcase()} <strong>${job.experience}</strong></span>
            <span class="job-detail-meta-item">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <strong>${job.employmentType}</strong>
            </span>
            ${job.salary && job.salary !== 'Not Disclosed' ? `<span class="job-detail-meta-item">${iconMoney()} <strong>₹ ${job.salary}</strong></span>` : ''}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${expired ? '<span class="badge badge-expired">Expired</span>' : '<span class="badge badge-active">Active</span>'}
            ${newJob && !expired ? '<span class="badge badge-new">New</span>' : ''}
            ${job.featured && !expired ? '<span class="badge badge-featured">Featured</span>' : ''}
            <span class="badge badge-type">${job.employmentType}</span>
          </div>
        </div>
        <div class="job-detail-actions">
          ${expired
            ? `<button class="jd-apply-btn" disabled aria-disabled="true" style="opacity:.5;cursor:not-allowed;background:#e2e8f0;color:#94a3b8;box-shadow:none">Application Closed</button>`
            : `<a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer" class="jd-apply-btn">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                Apply Now
              </a>`}
          <button class="jd-share-btn" onclick="toggleShareMenu()" id="shareToggleBtn" aria-label="Share this job">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            Share
          </button>
          <div id="shareMenu" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:8px;min-width:200px;z-index:200">
            <a id="smWhatsapp" href="#" target="_blank" rel="noopener noreferrer" class="share-menu-item" style="color:#15803d">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a id="smLinkedin" href="#" target="_blank" rel="noopener noreferrer" class="share-menu-item" style="color:#1d4ed8">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <button class="share-menu-item" id="smCopy" onclick="copyLink()" style="color:#374151;background:none;border:none;width:100%;cursor:pointer;font-family:inherit">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span id="copyLabel">Copy Link</span>
            </button>
          </div>
          <a href="/jobs/" class="jd-back-btn">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            All Jobs
          </a>
        </div>
      </div>
    </div>`;

  // Main content
  document.getElementById('jobDetailMain').innerHTML = `
    ${job.description ? `
      <div class="detail-card">
        <h3>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Job Description
        </h3>
        <p>${job.description}</p>
      </div>` : ''}

    ${job.responsibilities && job.responsibilities.length ? `
      <div class="detail-card">
        <h3>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          Key Responsibilities
        </h3>
        <ul class="detail-list">
          ${job.responsibilities.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>` : ''}

    ${job.eligibility && job.eligibility.length ? `
      <div class="detail-card">
        <h3>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          Eligibility Criteria
        </h3>
        <ul class="detail-list">
          ${job.eligibility.map(e => `<li>${e}</li>`).join('')}
        </ul>
      </div>` : ''}

    ${job.skills && job.skills.length ? `
      <div class="detail-card">
        <h3>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
          Required Skills
        </h3>
        <div class="skills-list">
          ${job.skills.map(s => `<span class="skill-tag-lg">${s}</span>`).join('')}
        </div>
      </div>` : ''}

    <div class="detail-card apply-card">
      <h3>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        How to Apply
      </h3>
      ${expired
        ? `<div class="expired-notice">
            <strong>This job posting has expired.</strong><br>
            The application deadline was ${formatDate(job.expiryDate)}. Please check our <a href="/jobs/" style="color:var(--primary)">latest jobs</a> for current openings.
          </div>`
        : `<p>Click the <strong>Apply Now</strong> button to visit the official application page on ${job.company}'s careers portal. Make sure your resume is up to date before applying.</p>
           <br>
           <a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary apply-btn-full">
             <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
             Apply Now on ${job.company} Careers
           </a>`}
    </div>`;

  // Sticky apply bar
  if (!expired && job.applicationUrl) {
    const bar = document.createElement('div');
    bar.id = 'stickyApplyBar';
    bar.innerHTML = `
      <div class="sticky-bar-inner">
        <div class="sticky-bar-info">
          <span class="sticky-bar-title">${job.title}</span>
          <span class="sticky-bar-company">${job.company} &bull; ${job.location}</span>
        </div>
        <a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer" class="sticky-bar-apply">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          Apply Now
        </a>
      </div>`;
    document.body.appendChild(bar);
    // show only after scrolling past the header apply button
    const observer = new IntersectionObserver(([e]) => {
      bar.classList.toggle('visible', !e.isIntersecting);
    }, { threshold: 0 });
    const headerApply = document.querySelector('.job-detail-actions .btn-primary');
    if (headerApply) observer.observe(headerApply);
  }

  // wire up header share menu links now that DOM is rendered
  const jobURL = window.location.origin + '/job/?slug=' + job.slug;
  const shareText = encodeURIComponent(`${job.title} at ${job.company} – Apply now on CodeDev`);
  const shareURL = encodeURIComponent(jobURL);
  const waEl = document.getElementById('smWhatsapp');
  const liEl = document.getElementById('smLinkedin');
  if (waEl) waEl.href = `https://wa.me/?text=${shareText}%20${shareURL}`;
  if (liEl) liEl.href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareURL}`;
  // position share menu relative to its toggle button
  const actionsEl = document.querySelector('.job-detail-actions');
  if (actionsEl) actionsEl.style.position = 'relative';

  document.getElementById('jobDetailSidebar').innerHTML = `
    <div class="sidebar-card">
      <h4>Job Overview</h4>
      <div class="sidebar-info-list">
        <div class="sidebar-info-item">
          ${iconLocation()}
          <div><div class="label">Location</div><div class="value">${job.location}</div></div>
        </div>
        <div class="sidebar-info-item">
          ${iconBriefcase()}
          <div><div class="label">Experience</div><div class="value">${job.experience}</div></div>
        </div>
        <div class="sidebar-info-item">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <div><div class="label">Employment Type</div><div class="value">${job.employmentType}</div></div>
        </div>
        <div class="sidebar-info-item">
          ${iconMoney()}
          <div><div class="label">Salary</div><div class="value">${job.salary && job.salary !== 'Not Disclosed' ? '₹ ' + job.salary : 'Not Disclosed'}</div></div>
        </div>
        ${job.education ? `
        <div class="sidebar-info-item">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
          <div><div class="label">Education</div><div class="value" style="font-size:.82rem">${job.education}</div></div>
        </div>` : ''}
        <div class="sidebar-info-item">
          ${iconCalendar()}
          <div><div class="label">Posted On</div><div class="value">${formatDate(job.postedDate)}</div></div>
        </div>
        <div class="sidebar-info-item">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div>
            <div class="label">Last Date to Apply</div>
            <div class="value${expired ? '" style="color:#dc2626' : ''}">${formatDate(job.expiryDate)}${!expired && days !== null && days <= 5 ? ` <span style="color:#dc2626;font-size:.8rem">(${days}d left)</span>` : ''}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-card">
      <h4>Share This Job</h4>
      <div class="share-buttons">
        <a href="https://wa.me/?text=${shareText}%20${shareURL}" target="_blank" rel="noopener noreferrer" class="share-btn share-btn-whatsapp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share on WhatsApp
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareURL}" target="_blank" rel="noopener noreferrer" class="share-btn share-btn-linkedin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          Share on LinkedIn
        </a>
        <button class="share-btn share-btn-copy" onclick="copyToClipboard(window.location.origin + '/job/?slug=' + new URLSearchParams(window.location.search).get('slug'))">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy Job Link
        </button>
      </div>
    </div>`;
}

function toggleShareMenu() {
  const menu = document.getElementById('shareMenu');
  if (!menu) return;
  const open = menu.style.display === 'block';
  menu.style.display = open ? 'none' : 'block';
}

function copyLink() {
  const url = window.location.origin + '/job/?slug=' + new URLSearchParams(window.location.search).get('slug');
  navigator.clipboard.writeText(url).then(() => {
    const lbl = document.getElementById('copyLabel');
    if (lbl) { lbl.textContent = 'Copied!'; setTimeout(() => lbl.textContent = 'Copy Link', 2000); }
  });
}

function copyToClipboard(url) {
  navigator.clipboard.writeText(url).then(() => {
    const btns = document.querySelectorAll('.share-btn-copy');
    btns.forEach(b => { b.textContent = '✓ Copied!'; setTimeout(() => b.innerHTML = '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy Job Link', 2000); });
  });
}

document.addEventListener('click', e => {
  const menu = document.getElementById('shareMenu');
  const btn = document.getElementById('shareToggleBtn');
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) menu.style.display = 'none';
});

function renderRelatedJobs(jobs, currentJob) {
  const active = jobs.filter(j => j.id !== currentJob.id && !isExpired(j.expiryDate));

  // Score each job by relevance — higher = more related
  const scored = active.map(j => {
    let score = 0;
    if (j.company === currentJob.company) score += 10;
    if (j.location === currentJob.location) score += 4;
    if (j.experience === currentJob.experience) score += 3;
    if (j.employmentType === currentJob.employmentType) score += 2;
    const sharedSkills = (j.skills || []).filter(s => (currentJob.skills || []).includes(s)).length;
    score += sharedSkills * 3;
    return { job: j, score };
  }).sort((a, b) => b.score - a.score);

  // Take top 3 — if none have any relevance, fall back to latest 3 by posted date
  const hasRelated = scored.some(s => s.score > 0);
  const picks = hasRelated
    ? scored.filter(s => s.score > 0).slice(0, 3).map(s => s.job)
    : active.slice().sort((a, b) => new Date(b.postedDate || b.posted_date || 0) - new Date(a.postedDate || a.posted_date || 0)).slice(0, 3);

  const el = document.getElementById('relatedJobs');
  if (!picks.length) { el.style.display = 'none'; return; }

  const heading = hasRelated ? 'Related Job Openings' : 'More Openings You Might Like';
  el.innerHTML = `
    <h3>
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      ${heading}
    </h3>
    <div class="related-jobs-grid">
      ${picks.map(j => buildJobCard(j, '../')).join('')}
    </div>
    <div style="text-align:center;margin-top:24px">
      <a href="/jobs/" class="btn btn-outline btn-sm" style="display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--border);padding:10px 24px;border-radius:8px;font-weight:600;color:var(--text-body);text-decoration:none;transition:all .2s" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-body)'">
        View All Jobs →
      </a>
    </div>`;
}

function updateSEO(job) {
  document.title = `${job.title} at ${job.company} | CodeDev`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', `${job.title} job at ${job.company} in ${job.location}. Experience: ${job.experience}. Apply now on CodeDev.`);
}

function showError(msg) {
  document.getElementById('jobDetailHeader').innerHTML = `
    <div class="container">
      <div class="empty-state" style="padding:48px 0">
        <h3>${msg}</h3>
        <p><a href="/jobs/" class="btn btn-primary" style="margin-top:16px">Browse All Jobs</a></p>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
