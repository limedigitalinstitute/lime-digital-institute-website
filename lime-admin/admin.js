(function () {
  'use strict';

  // --- CONFIG & STATE ---
  const API_BASE = window.location.pathname.includes('.php') ? '../api' : '/api';
  const urlParams = new URLSearchParams(window.location.search);
  let authToken = urlParams.get('token') || localStorage.getItem('lime_admin_token') || '';
  if (urlParams.get('token')) {
    localStorage.setItem('lime_admin_token', authToken);
  }
  let allEvents = [];
  let allLeads = [];
  let activeTab = 'eventsTab';
  let activeFilter = 'all';

  // --- DOM ELEMENTS ---
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const adminUser = document.getElementById('adminUser');
  const adminPass = document.getElementById('adminPass');
  const togglePassBtn = document.getElementById('togglePassBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const dashToast = document.getElementById('dashToast');

  // Stats
  const statTotalEvents = document.getElementById('statTotalEvents');
  const statUpcomingEvents = document.getElementById('statUpcomingEvents');
  const statOnDemandEvents = document.getElementById('statOnDemandEvents');
  const statTotalLeads = document.getElementById('statTotalLeads');
  const badgeEventsCount = document.getElementById('badgeEventsCount');
  const badgeLeadsCount = document.getElementById('badgeLeadsCount');

  // Filters & Search
  const countFilterAll = document.getElementById('countFilterAll');
  const countFilterUpcoming = document.getElementById('countFilterUpcoming');
  const countFilterCompleted = document.getElementById('countFilterCompleted');
  const eventSearchInput = document.getElementById('eventSearchInput');
  const eventsListContainer = document.getElementById('eventsListContainer');
  const exportLeadsBtn = document.getElementById('exportLeadsBtn');

  // Leads
  const leadsEventFilter = document.getElementById('leadsEventFilter');
  const leadsSearchInput = document.getElementById('leadsSearchInput');
  const leadsTableBody = document.getElementById('leadsTableBody');
  const leadsEmptyState = document.getElementById('leadsEmptyState');

  // Modal
  const sessionModal = document.getElementById('sessionModal');
  const modalDialogTitle = document.getElementById('modalDialogTitle');
  const sessionForm = document.getElementById('sessionForm');
  const openCreateModalBtn = document.getElementById('openCreateModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // --- TOAST HELPER ---
  function showToast(msg, duration = 3000) {
    dashToast.textContent = msg;
    dashToast.classList.remove('hidden');
    setTimeout(() => {
      dashToast.classList.add('hidden');
    }, duration);
  }

  // --- API REQUEST HELPER ---
  async function apiRequest(endpoint, options = {}) {
    options.headers = options.headers || {};
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    // Attempt direct endpoint or fallback to .php for Hostinger
    let url = endpoint;
    try {
      let res = await fetch(url, options);
      if (res.status === 404 && !url.includes('.php')) {
        // Fallback for Apache/PHP without mod_rewrite
        const phpUrl = url.replace('/api/', '/api/').replace(/\/$/, '') + '.php';
        res = await fetch(phpUrl, options);
      }
      return await res.json();
    } catch (err) {
      console.error('API Error on ' + url, err);
      return { success: false, error: 'Network error or server unreachable' };
    }
  }

  // --- AUTH FLOW ---
  togglePassBtn.addEventListener('click', () => {
    const isPass = adminPass.type === 'password';
    adminPass.type = isPass ? 'text' : 'password';
    togglePassBtn.textContent = isPass ? '🙈' : '👁️';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.classList.add('hidden');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying credentials...';

    const res = await apiRequest(`${API_BASE}/auth`, {
      method: 'POST',
      body: { username: adminUser.value.trim(), password: adminPass.value }
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In to Dashboard →';

    if (res.success && res.token) {
      authToken = res.token;
      localStorage.setItem('lime_admin_token', authToken);
      initDashboard();
    } else {
      loginAlert.textContent = res.error || 'Invalid credentials. Please try again.';
      loginAlert.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    authToken = '';
    localStorage.removeItem('lime_admin_token');
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginAlert.classList.add('hidden');
    adminPass.value = '';
  });

  async function checkExistingAuth() {
    if (!authToken) {
      loginScreen.classList.remove('hidden');
      dashboardScreen.classList.add('hidden');
      return;
    }
    // Token is present, initialize dashboard
    initDashboard();
  }

  // --- INITIALIZE DASHBOARD ---
  async function initDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    await loadEvents();
    await loadLeads();
  }

  // --- EVENTS LOAD & RENDER ---
  async function loadEvents() {
    const res = await apiRequest(`${API_BASE}/events`, { method: 'GET' });
    if (res.success && Array.isArray(res.events)) {
      allEvents = res.events;
      updateMetrics();
      renderEventsList();
      populateLeadsEventFilter();
    }
  }

  function updateMetrics() {
    const upcoming = allEvents.filter(e => e.status === 'upcoming').length;
    const completed = allEvents.filter(e => e.status === 'completed' || e.status === 'ondemand').length;

    statTotalEvents.textContent = allEvents.length;
    statUpcomingEvents.textContent = upcoming;
    statOnDemandEvents.textContent = completed;
    badgeEventsCount.textContent = allEvents.length;

    countFilterAll.textContent = allEvents.length;
    countFilterUpcoming.textContent = upcoming;
    countFilterCompleted.textContent = completed;
  }

  function renderEventsList() {
    const term = eventSearchInput.value.toLowerCase().trim();
    const filtered = allEvents.filter(e => {
      const matchSearch = (e.title || '').toLowerCase().includes(term) || (e.location || '').toLowerCase().includes(term);
      if (!matchSearch) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'upcoming') return e.status === 'upcoming';
      if (activeFilter === 'completed') return e.status === 'completed' || e.status === 'ondemand';
      if (activeFilter === 'online') return e.type === 'online';
      if (activeFilter === 'offline') return e.type === 'offline';
      return true;
    });

    if (filtered.length === 0) {
      eventsListContainer.innerHTML = `
        <div class="empty-state" style="background:#fff; border:1px solid var(--border); border-radius:var(--r-md);">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No masterclass sessions match your filter</div>
          <p class="empty-sub">Try selecting another filter or click "Create New Session" above.</p>
        </div>`;
      return;
    }

    eventsListContainer.innerHTML = filtered.map(e => {
      const isUpcoming = e.status === 'upcoming';
      const statusClass = isUpcoming ? 'status-upcoming' : 'status-completed';
      const statusLabel = isUpcoming ? '<span class="live-dot"></span> Live / Upcoming' : '▶ Watch Recording';
      const toggleBtnClass = isUpcoming ? 'btn-toggle-recording' : 'btn-toggle-upcoming';
      const toggleBtnLabel = isUpcoming ? 'Switch to Recording' : 'Switch to Upcoming';
      const viewUrl = `../event?id=${encodeURIComponent(e.id)}`;

      return `
        <div class="session-admin-card" data-id="${e.id}">
          <div class="session-thumb-wrap">
            <img src="../${e.thumbnail || 'assets/webinars/masterclass-ai-prompting.jpg'}" alt="${e.title}" class="session-thumb" onerror="this.src='../assets/webinars/masterclass-ai-prompting.jpg'">
            <span class="thumb-type-tag">${e.type === 'offline' ? 'Offline' : 'Online'}</span>
          </div>
          
          <div class="session-title-col">
            <h3>${e.title}</h3>
            <div class="session-meta-row">
              <span>📅 ${e.dateDisplay || e.date}</span>
              <span>⏰ ${e.time || '90 Mins'}</span>
              <span>📍 ${e.location || 'Zoom'}</span>
              ${isUpcoming ? `<span>🎟️ <strong>${e.seatsLeft || 0}</strong> seats left</span>` : ''}
            </div>
          </div>

          <div class="session-status-col">
            <span class="status-pill ${statusClass}">${statusLabel}</span>
            <span class="speaker-micro">👤 ${e.speaker ? e.speaker.name : 'Lime Mentor'}</span>
          </div>

          <div class="session-actions-col">
            <button type="button" class="btn-sm-action ${toggleBtnClass}" onclick="toggleEventStatus('${e.id}')" title="Toggle between Upcoming and Watch Recording">
              ${toggleBtnLabel}
            </button>
            <a href="${viewUrl}" target="_blank" class="btn-sm-action btn-view-sm" title="Preview Event Page">
              Preview &nearr;
            </a>
            <button type="button" class="btn-sm-action btn-edit-sm" onclick="openEditModal('${e.id}')" title="Edit Session Details">
              Edit
            </button>
            <button type="button" class="btn-sm-action btn-del-sm" onclick="deleteEvent('${e.id}')" title="Delete Session">
              Delete
            </button>
          </div>
        </div>`;
    }).join('');
  }

  // Filter chips click
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderEventsList();
    });
  });

  eventSearchInput.addEventListener('input', () => {
    renderEventsList();
  });

  // --- SINGLE-CLICK TOGGLE STATUS ---
  window.toggleEventStatus = async function (id) {
    const ev = allEvents.find(e => e.id === id);
    if (!ev) return;
    const newStatus = ev.status === 'upcoming' ? 'completed' : 'upcoming';
    const newBadge = newStatus === 'completed' ? 'Watch Recording' : 'Upcoming Session';

    const res = await apiRequest(`${API_BASE}/events?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { status: newStatus, badge: newBadge }
    });

    if (res.success) {
      ev.status = newStatus;
      ev.badge = newBadge;
      updateMetrics();
      renderEventsList();
      showToast(`Switched "${ev.title}" to ${newStatus === 'completed' ? 'Watch Recording' : 'Live / Upcoming'}!`);
    } else {
      alert(res.error || 'Failed to update event status');
    }
  };

  // --- DELETE EVENT ---
  window.deleteEvent = async function (id) {
    if (!confirm('Are you sure you want to delete this masterclass session?')) return;
    const res = await apiRequest(`${API_BASE}/events?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res.success) {
      allEvents = allEvents.filter(e => e.id !== id);
      updateMetrics();
      renderEventsList();
      showToast('Masterclass session deleted.');
    } else {
      alert(res.error || 'Failed to delete event');
    }
  };

  // --- IMAGE UPLOAD (thumbnail + speaker photo) ---
  function wireImageUpload(fileInputId, btnId, statusId, selectId, target) {
    const fileInput = document.getElementById(fileInputId);
    const btn = document.getElementById(btnId);
    const status = document.getElementById(statusId);
    const select = document.getElementById(selectId);
    if (!fileInput || !btn || !select) return;

    btn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      status.textContent = 'Uploading...';
      btn.disabled = true;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', target);
      formData.append('name', file.name.replace(/\.[^.]+$/, ''));

      try {
        const res = await apiRequest(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData
        });
        if (res.success && res.path) {
          const opt = document.createElement('option');
          opt.value = res.path;
          opt.textContent = file.name + ' (uploaded)';
          select.appendChild(opt);
          select.value = res.path;
          status.textContent = '✓ Uploaded';
        } else {
          status.textContent = '✗ ' + (res.error || 'Upload failed');
        }
      } catch (err) {
        status.textContent = '✗ Upload failed';
      } finally {
        btn.disabled = false;
        fileInput.value = '';
        setTimeout(() => { status.textContent = ''; }, 4000);
      }
    });
  }

  wireImageUpload('eventThumbnailFile', 'eventThumbnailUploadBtn', 'eventThumbnailUploadStatus', 'eventThumbnail', 'webinar');
  wireImageUpload('speakerPhotoFile', 'speakerPhotoUploadBtn', 'speakerPhotoUploadStatus', 'speakerPhoto', 'mentor');

  // --- CREATE / EDIT MODAL ---
  openCreateModalBtn.addEventListener('click', () => {
    modalDialogTitle.textContent = 'Create New Masterclass';
    sessionForm.reset();
    document.getElementById('editSessionId').value = '';
    document.getElementById('eventSeatsLeft').value = '20';
    document.getElementById('speakerName').value = 'Paras Patel';
    document.getElementById('speakerRole').value = 'Founder & AI Marketing Strategist';
    sessionModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => sessionModal.classList.add('hidden'));
  cancelModalBtn.addEventListener('click', () => sessionModal.classList.add('hidden'));

  window.openEditModal = function (id) {
    const ev = allEvents.find(e => e.id === id);
    if (!ev) return;

    modalDialogTitle.textContent = 'Edit Masterclass Session';
    document.getElementById('editSessionId').value = ev.id;
    document.getElementById('eventTitle').value = ev.title || '';
    document.getElementById('eventSlug').value = ev.id || '';
    document.getElementById('eventSubtitle').value = ev.subtitle || '';
    document.getElementById('eventType').value = ev.type || 'online';
    document.getElementById('eventStatus').value = ev.status || 'upcoming';
    document.getElementById('eventBadge').value = ev.badge || '';
    document.getElementById('eventDate').value = ev.date || '';
    document.getElementById('eventDateDisplay').value = ev.dateDisplay || '';
    document.getElementById('eventTime').value = ev.time || '';
    document.getElementById('eventLocation').value = ev.location || '';
    document.getElementById('eventSeatsLeft').value = ev.seatsLeft !== undefined ? ev.seatsLeft : 20;
    document.getElementById('eventThumbnail').value = ev.thumbnail || 'assets/webinars/masterclass-ai-prompting.jpg';
    document.getElementById('eventVideoUrl').value = ev.videoUrl || '';

    if (ev.speaker) {
      document.getElementById('speakerName').value = ev.speaker.name || '';
      document.getElementById('speakerRole').value = ev.speaker.role || '';
      document.getElementById('speakerPhoto').value = ev.speaker.photo || 'assets/mentors/paras-patel.webp';
    }

    document.getElementById('eventTakeaways').value = Array.isArray(ev.takeaways) ? ev.takeaways.join('\n') : '';
    document.getElementById('eventWhoIsThisFor').value = Array.isArray(ev.whoIsThisFor) ? ev.whoIsThisFor.join('\n') : '';

    sessionModal.classList.remove('hidden');
  };

  sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editSessionId').value.trim();
    const isEdit = Boolean(editId);

    const payload = {
      title: document.getElementById('eventTitle').value.trim(),
      subtitle: document.getElementById('eventSubtitle').value.trim(),
      type: document.getElementById('eventType').value,
      status: document.getElementById('eventStatus').value,
      badge: document.getElementById('eventBadge').value.trim(),
      date: document.getElementById('eventDate').value,
      dateDisplay: document.getElementById('eventDateDisplay').value.trim(),
      time: document.getElementById('eventTime').value.trim(),
      location: document.getElementById('eventLocation').value.trim(),
      seatsLeft: parseInt(document.getElementById('eventSeatsLeft').value, 10) || 0,
      thumbnail: document.getElementById('eventThumbnail').value,
      videoUrl: document.getElementById('eventVideoUrl').value.trim(),
      speaker: {
        name: document.getElementById('speakerName').value.trim(),
        role: document.getElementById('speakerRole').value.trim(),
        photo: document.getElementById('speakerPhoto').value,
        bio: 'Senior practitioner at Lime Digital Institute.'
      },
      takeaways: document.getElementById('eventTakeaways').value.split('\n').map(s => s.trim()).filter(Boolean),
      whoIsThisFor: document.getElementById('eventWhoIsThisFor').value.split('\n').map(s => s.trim()).filter(Boolean)
    };

    const saveBtn = document.getElementById('saveSessionBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving session...';

    let res;
    if (isEdit) {
      res = await apiRequest(`${API_BASE}/events?id=${encodeURIComponent(editId)}`, {
        method: 'PUT',
        body: payload
      });
    } else {
      if (document.getElementById('eventSlug').value.trim()) {
        payload.id = document.getElementById('eventSlug').value.trim();
      }
      res = await apiRequest(`${API_BASE}/events`, {
        method: 'POST',
        body: payload
      });
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Masterclass →';

    if (res.success) {
      sessionModal.classList.add('hidden');
      await loadEvents();
      showToast(isEdit ? 'Session updated successfully!' : 'New session published successfully!');
    } else {
      alert(res.error || 'Failed to save session');
    }
  });

  // --- LEADS MANAGEMENT ---
  async function loadLeads() {
    const res = await apiRequest(`${API_BASE}/leads`, { method: 'GET' });
    if (res.success && Array.isArray(res.leads)) {
      allLeads = res.leads;
      statTotalLeads.textContent = allLeads.length;
      badgeLeadsCount.textContent = allLeads.length;
      renderLeadsTable();
    }
  }

  function populateLeadsEventFilter() {
    const current = leadsEventFilter.value;
    leadsEventFilter.innerHTML = '<option value="all">All Masterclasses</option>' +
      allEvents.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
    if (current) leadsEventFilter.value = current;
  }

  function renderLeadsTable() {
    const eventFilter = leadsEventFilter.value;
    const term = leadsSearchInput.value.toLowerCase().trim();

    const filtered = allLeads.filter(lead => {
      if (eventFilter !== 'all' && lead.eventId !== eventFilter) return false;
      if (!term) return true;
      const haystack = `${lead.name} ${lead.email} ${lead.phone} ${lead.eventTitle} ${lead.utm_source || ''} ${lead.utm_medium || ''} ${lead.utm_campaign || ''} ${lead.utm_form || ''}`.toLowerCase();
      return haystack.includes(term);
    });

    if (filtered.length === 0) {
      leadsTableBody.innerHTML = '';
      leadsEmptyState.classList.remove('hidden');
      return;
    }

    leadsEmptyState.classList.add('hidden');
    leadsTableBody.innerHTML = filtered.map(r => {
      const dateStr = r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short'
      }) : '—';

      const utmParts = [r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean);
      const utmLabel = utmParts.length ? utmParts.join(' / ') : (r.utm_form || '—');

      return `
        <tr>
          <td style="font-size:12px; color:var(--ink-500);">${dateStr}</td>
          <td><strong>${r.name || '—'}</strong></td>
          <td><a href="https://wa.me/${(r.phone || '').replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--primary); font-weight:600; text-decoration:underline;">${r.phone || '—'}</a></td>
          <td><a href="mailto:${r.email}" style="color:var(--ink-700);">${r.email || '—'}</a></td>
          <td><span style="font-size:12px; font-weight:600;">${r.eventTitle || r.eventId || '—'}</span></td>
          <td><span style="background:#F1F5F9; padding:3px 8px; border-radius:var(--r-pill); font-size:11.5px; font-weight:600;">${r.goal || 'General'}</span></td>
          <td><span style="font-size:11.5px; color:var(--ink-500);">${utmLabel}</span></td>
        </tr>`;
    }).join('');
  }

  leadsEventFilter.addEventListener('change', renderLeadsTable);
  leadsSearchInput.addEventListener('input', renderLeadsTable);

  exportLeadsBtn.addEventListener('click', () => {
    window.location.href = `${API_BASE}/leads/export?token=${encodeURIComponent(authToken)}`;
  });

  // --- PAGE SECTIONS (Mini CMS) ---
  // Field registry: which text elements on each page are editable, and what
  // they show as a placeholder when no override has been saved yet. Add a
  // new page here + a matching data-cms="key" attribute on the HTML element
  // to make more sections editable.
  const SECTIONS_REGISTRY = {
    homepage: [
      { key: 'hero.lead', label: 'Hero — Lead paragraph', placeholder: 'Join the Top Digital Marketing Courses offering hands-on training in India.' },
      { key: 'hero.subhead', label: 'Hero — Subhead line', placeholder: 'Online or Offline. Choose What Works for You.' },
      { key: 'salary.eyebrow', label: 'Career & Business Potential — Eyebrow tag', placeholder: 'Career & Business Potential' },
      { key: 'salary.heading', label: 'Career & Business Potential — Heading', placeholder: 'Why Digital Marketing Pays Off - For You, Or Your Business' },
      { key: 'salary.lead', label: 'Career & Business Potential — Lead paragraph', placeholder: "Whether you're building a career or growing a business, digital marketing with Gen AI is where the money is moving." },
      { key: 'philosophy.heading', label: 'Our Philosophy — Heading', placeholder: 'Our Philosophy' },
      { key: 'philosophy.desc', label: 'Our Philosophy — Description', placeholder: 'At Lime Digital Institute, everything we do from running high-ROI ad campaigns to teaching paid ads is driven by one mission: to create real, measurable growth.' },
      { key: 'philosophy.quote', label: 'Our Philosophy — Quote', placeholder: 'The art of marketing is the art of brand building...' },
      { key: 'philosophy.author', label: 'Our Philosophy — Quote author', placeholder: 'Philip Kotler' }
    ]
  };

  // All live pages on the site, mapped to their file path (relative to
  // /lime-admin/) so the preview iframe and the page-picker dropdown always
  // cover every page, not just the ones with editable text fields yet.
  const PAGES_MAP = {
    homepage: { label: 'Homepage', file: '../index.html' },
    about: { label: 'About', file: '../about.html' },
    courses: { label: 'Courses', file: '../courses.html' },
    'foundation-program': { label: 'Foundation Program', file: '../foundation-program.html' },
    'digital-marketing-professional': { label: 'Digital Marketing Professional', file: '../digital-marketing-professional.html' },
    'bachelors-in-digital-business': { label: "Bachelor's in Digital Business", file: '../bachelors-in-digital-business.html' },
    'masters-in-digital-business': { label: "Master's in Digital Business", file: '../masters-in-digital-business.html' },
    'case-studies': { label: 'Case Studies', file: '../case-studies.html' },
    placements: { label: 'Placements', file: '../placements.html' },
    'hire-from-us': { label: 'Hire From Us', file: '../hire-from-us.html' },
    trainers: { label: 'Trainers', file: '../trainers.html' },
    'student-life': { label: 'Student Life', file: '../student-life.html' },
    alumni: { label: 'Alumni', file: '../alumni.html' },
    reviews: { label: 'Reviews', file: '../reviews.html' },
    blog: { label: 'Blog', file: '../blog.html' },
    contact: { label: 'Contact', file: '../contact.html' },
    'refer-earn': { label: 'Refer & Earn', file: '../refer-earn.html' },
    'free-masterclass': { label: 'Free Masterclass', file: '../masterclass.html' },
    event: { label: 'Event Hub', file: '../event.html' },
    '3-day-demo-class': { label: '3-Day Demo Class', file: '../3-day-demo-class.html' },
    'thank-you': { label: 'Thank You', file: '../thank-you.html' },
    'event-thank-you': { label: 'Event Thank You', file: '../event-thank-you.html' }
  };

  const sectionsPageSelect = document.getElementById('sectionsPageSelect');
  const sectionsFieldsContainer = document.getElementById('sectionsFieldsContainer');
  const sectionsIdList = document.getElementById('sectionsIdList');
  const previewModal = document.getElementById('previewModal');
  const previewFrame = document.getElementById('previewFrame');
  const previewFrameWrap = document.getElementById('previewFrameWrap');
  const previewModalSectionLabel = document.getElementById('previewModalSectionLabel');
  const sectionEditorModal = document.getElementById('sectionEditorModal');
  const sectionEditorLabel = document.getElementById('sectionEditorLabel');
  const sectionEditorTextarea = document.getElementById('sectionEditorTextarea');
  let sectionsLoaded = false;
  let currentPreviewPage = null;
  let currentPreviewSectionId = null;

  // Populate the page dropdown from PAGES_MAP once, in display order.
  if (sectionsPageSelect) {
    sectionsPageSelect.innerHTML = Object.entries(PAGES_MAP).map(([key, p]) =>
      `<option value="${key}">${p.label} (${p.file.replace('../', '')})</option>`
    ).join('');
  }

  // Fetches the page's raw HTML (no iframe needed) and parses every
  // <section id="..."> out of it, rendering them as clickable chips.
  // Clicking a chip opens the full preview popup scrolled to that section.
  async function renderSectionIdList(page) {
    if (!sectionsIdList) return;
    const p = PAGES_MAP[page];
    if (!p) return;
    sectionsIdList.innerHTML = '<p class="empty-sub">Loading sections...</p>';

    let doc;
    try {
      const html = await fetch(p.file).then(r => r.text());
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      sectionsIdList.innerHTML = '<p class="empty-sub">Could not load this page to scan sections.</p>';
      return;
    }

    const sections = Array.from(doc.querySelectorAll('section[id]'));
    if (sections.length === 0) {
      sectionsIdList.innerHTML = '<p class="empty-sub">No named sections found on this page.</p>';
      return;
    }

    sectionsIdList.innerHTML = sections.map((sec, i) => {
      const heading = sec.querySelector('h1, h2, h3');
      const label = heading ? heading.textContent.trim().slice(0, 40) : sec.id;
      // A section already wrapping a [data-global-section] block is global —
      // star shows filled, click jumps to Global Sections. Otherwise the
      // star promotes it (star click), and a separate pencil opens a
      // page-local editor (this page only, no global section created).
      const globalName = sec.querySelector('[data-global-section]')?.getAttribute('data-global-section') || null;
      const starBtn = globalName
        ? `<button type="button" class="chip-star chip-star-filled" data-global-name="${globalName}" title="Global section (${globalName}) — click to edit, updates every page">★</button>`
        : `<button type="button" class="chip-star" data-section-id="${sec.id}" title="Make this a Global Section">☆</button>`;
      const editBtn = globalName ? '' :
        `<button type="button" class="chip-edit-btn" data-section-id="${sec.id}" title="Edit this section's HTML (this page only)">✎</button>`;
      return `<span class="section-id-chip-wrap">
        <button type="button" class="chip-move-btn" data-move="up" data-section-id="${sec.id}" title="Move up" ${i === 0 ? 'disabled' : ''}>&#8593;</button>
        <button type="button" class="chip-move-btn" data-move="down" data-section-id="${sec.id}" title="Move down" ${i === sections.length - 1 ? 'disabled' : ''}>&#8595;</button>
        <button type="button" class="section-id-chip" data-section-id="${sec.id}"><span class="chip-pos">${i + 1}</span><span class="chip-hash">#</span>${sec.id}${heading ? ' — ' + label : ''}</button>
        ${starBtn}${editBtn}
      </span>`;
    }).join('');

    sectionsIdList.querySelectorAll('.section-id-chip').forEach(chip => {
      chip.addEventListener('click', () => openPreviewModal(page, chip.dataset.sectionId));
    });

    sectionsIdList.querySelectorAll('.chip-move-btn').forEach(btn => {
      btn.addEventListener('click', () => moveSection(page, btn.dataset.sectionId, btn.dataset.move));
    });

    sectionsIdList.querySelectorAll('.chip-star').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.classList.contains('chip-star-filled')) {
          openGlobalSectionEditor(btn.dataset.globalName);
        } else {
          promoteToGlobal(page, btn.dataset.sectionId);
        }
      });
    });

    sectionsIdList.querySelectorAll('.chip-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSectionEditor(page, btn.dataset.sectionId);
      });
    });
  }

  // Extracts this section's inner HTML into a new Global Section (named
  // after the section id) and replaces it on the page with a
  // data-global-section placeholder. From then on it's edited once in the
  // Global Sections tab and updates every page that reuses it.
  async function promoteToGlobal(page, sectionId) {
    if (!confirm(`Make #${sectionId} a Global Section?\n\nIts content moves to Global Sections (edited once, updates everywhere it's reused) and can't be edited per-page anymore.`)) return;
    const res = await apiRequest(`${API_BASE}/promote-to-global`, {
      method: 'POST',
      body: { page, sectionId, globalName: sectionId }
    });
    if (res.success) {
      showToast(`#${sectionId} is now a Global Section`);
      renderSectionIdList(page);
      openGlobalSectionEditor(res.globalName);
    } else {
      showToast(res.error || 'Could not promote this section');
    }
  }

  // One editor modal, two modes:
  // - 'page' — this section's HTML lives in one page's file only (edit-section.php)
  // - 'global' — this section is a Global Section, shared JSON (sections.php);
  //   editing it updates every page that includes it, shown as raw JSON here.
  async function openSectionEditor(page, sectionId) {
    const res = await apiRequest(`${API_BASE}/edit-section?page=${encodeURIComponent(page)}&sectionId=${encodeURIComponent(sectionId)}`, { method: 'GET' });
    if (!res.success) {
      showToast(res.error || 'Could not load this section');
      return;
    }
    sectionEditorLabel.textContent = `#${sectionId} — this page only`;
    sectionEditorTextarea.value = res.html;
    sectionEditorTextarea.dataset.mode = 'page';
    sectionEditorTextarea.dataset.page = page;
    sectionEditorTextarea.dataset.sectionId = sectionId;
    sectionEditorModal.classList.remove('hidden');
  }

  async function openGlobalSectionEditor(name) {
    const res = await apiRequest(`${API_BASE}/sections?name=${encodeURIComponent(name)}`, { method: 'GET' });
    if (!res.success) {
      showToast(res.error || 'Could not load this global section');
      return;
    }
    sectionEditorLabel.textContent = `🌐 ${name} — updates every page using it`;
    sectionEditorTextarea.value = JSON.stringify(res.section, null, 2);
    sectionEditorTextarea.dataset.mode = 'global';
    sectionEditorTextarea.dataset.globalName = name;
    sectionEditorModal.classList.remove('hidden');
  }

  function closeSectionEditor() {
    sectionEditorModal.classList.add('hidden');
  }

  const sectionEditorCloseBtn = document.getElementById('sectionEditorCloseBtn');
  const sectionEditorSaveBtn = document.getElementById('sectionEditorSaveBtn');
  if (sectionEditorCloseBtn) sectionEditorCloseBtn.addEventListener('click', closeSectionEditor);
  if (sectionEditorModal) {
    sectionEditorModal.addEventListener('click', (e) => {
      if (e.target === sectionEditorModal) closeSectionEditor();
    });
  }
  if (sectionEditorSaveBtn) {
    sectionEditorSaveBtn.addEventListener('click', async () => {
      const mode = sectionEditorTextarea.dataset.mode;
      sectionEditorSaveBtn.disabled = true;
      sectionEditorSaveBtn.textContent = 'Saving...';

      let res, currentPage;
      if (mode === 'global') {
        const name = sectionEditorTextarea.dataset.globalName;
        let payload;
        try { payload = JSON.parse(sectionEditorTextarea.value); }
        catch (e) {
          showToast('Invalid JSON — fix before saving');
          sectionEditorSaveBtn.disabled = false;
          sectionEditorSaveBtn.textContent = 'Save';
          return;
        }
        res = await apiRequest(`${API_BASE}/sections?name=${encodeURIComponent(name)}`, { method: 'PUT', body: payload });
      } else {
        currentPage = sectionEditorTextarea.dataset.page;
        const sectionId = sectionEditorTextarea.dataset.sectionId;
        res = await apiRequest(`${API_BASE}/edit-section`, {
          method: 'POST',
          body: { page: currentPage, sectionId, html: sectionEditorTextarea.value }
        });
      }

      sectionEditorSaveBtn.disabled = false;
      sectionEditorSaveBtn.textContent = 'Save';
      if (res.success) {
        showToast(mode === 'global' ? 'Global section updated everywhere' : 'Saved');
        closeSectionEditor();
        if (currentPage) renderSectionIdList(currentPage);
      } else {
        showToast(res.error || 'Could not save');
      }
    });
  }

  // Calls the server-side reorder endpoint, which swaps the two adjacent
  // top-level <section> blocks directly in the live HTML file (byte-exact,
  // nothing else in the file is touched). Re-scans the chip list after.
  async function moveSection(page, sectionId, direction) {
    const res = await apiRequest(`${API_BASE}/reorder-section`, {
      method: 'POST',
      body: { page, sectionId, direction }
    });
    if (res.success) {
      showToast(`Moved #${sectionId} ${direction}`);
      renderSectionIdList(page);
    } else {
      showToast(res.error || 'Could not move section');
    }
  }

  // Opens the full preview popup for a page, at the current viewport
  // (desktop/tablet/mobile), scrolled to the given section id via #hash
  // navigation (native browser scroll, no cross-frame DOM access needed).
  function openPreviewModal(page, sectionId) {
    const p = PAGES_MAP[page];
    if (!p || !previewModal) return;
    currentPreviewPage = page;
    currentPreviewSectionId = sectionId || null;
    previewModalSectionLabel.textContent = sectionId ? `→ #${sectionId}` : '';
    previewFrame.src = p.file + (sectionId ? '#' + sectionId : '');
    previewModal.classList.remove('hidden');
  }

  function closePreviewModal() {
    if (!previewModal) return;
    previewModal.classList.add('hidden');
    previewFrame.src = 'about:blank';
  }

  const previewCloseBtn = document.getElementById('previewCloseBtn');
  if (previewCloseBtn) previewCloseBtn.addEventListener('click', closePreviewModal);
  if (previewModal) {
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) closePreviewModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewModal && !previewModal.classList.contains('hidden')) closePreviewModal();
  });

  const previewRefreshBtn = document.getElementById('previewRefreshBtn');
  if (previewRefreshBtn) {
    previewRefreshBtn.addEventListener('click', () => {
      if (currentPreviewPage) openPreviewModal(currentPreviewPage, currentPreviewSectionId);
    });
  }

  document.querySelectorAll('.preview-toggle-btn[data-viewport]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-toggle-btn[data-viewport]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      previewFrameWrap.classList.remove('tablet', 'mobile');
      if (btn.dataset.viewport === 'tablet') previewFrameWrap.classList.add('tablet');
      if (btn.dataset.viewport === 'mobile') previewFrameWrap.classList.add('mobile');
    });
  });

  async function loadSectionsForPage(page) {
    renderSectionIdList(page);
    const fields = SECTIONS_REGISTRY[page] || [];
    sectionsFieldsContainer.innerHTML = '<p class="empty-sub">Loading...</p>';

    const res = await apiRequest(`${API_BASE}/content?page=${encodeURIComponent(page)}`, { method: 'GET' });
    const saved = (res.success && res.content) ? res.content : {};

    if (fields.length === 0) {
      sectionsFieldsContainer.innerHTML = '<p class="empty-sub">No editable sections registered for this page yet.</p>';
      return;
    }

    sectionsFieldsContainer.innerHTML = fields.map(f => `
      <div class="form-field" style="margin-bottom:20px;">
        <label for="cms-${f.key}">${f.label}</label>
        <textarea id="cms-${f.key}" class="form-textarea" rows="2" data-key="${f.key}" placeholder="${f.placeholder.replace(/"/g, '&quot;')}">${saved[f.key] || ''}</textarea>
        <div style="display:flex; gap:8px; margin-top:8px; align-items:center;">
          <button type="button" class="btn-admin-secondary btn-sm-action cms-save-btn" data-key="${f.key}" data-page="${page}">Save</button>
          <span class="cms-save-status" data-status-for="${f.key}" style="font-size:12.5px; color:var(--muted, #6b7280);"></span>
        </div>
      </div>
    `).join('');

    sectionsFieldsContainer.querySelectorAll('.cms-save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const pageKey = btn.dataset.page;
        const textarea = document.getElementById(`cms-${key}`);
        const statusEl = sectionsFieldsContainer.querySelector(`[data-status-for="${key}"]`);
        btn.disabled = true;
        const prevLabel = btn.textContent;
        btn.textContent = 'Saving...';

        const body = {};
        body[key] = textarea.value.trim() === '' ? null : textarea.value;

        const saveRes = await apiRequest(`${API_BASE}/content?page=${encodeURIComponent(pageKey)}`, {
          method: 'PUT',
          body
        });

        btn.disabled = false;
        btn.textContent = prevLabel;

        if (saveRes.success) {
          statusEl.textContent = '✓ Saved — live on the page now';
          statusEl.style.color = '#16a34a';
          showToast('Section updated');
        } else {
          statusEl.textContent = saveRes.error || 'Save failed';
          statusEl.style.color = '#dc2626';
        }
        setTimeout(() => { statusEl.textContent = ''; }, 4000);
      });
    });
  }

  if (sectionsPageSelect) {
    sectionsPageSelect.addEventListener('change', () => loadSectionsForPage(sectionsPageSelect.value));
  }

  // --- TABS SWITCHING ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.remove('hidden');

      if (btn.dataset.tab === 'leadsTab') {
        exportLeadsBtn.classList.remove('hidden');
        openCreateModalBtn.classList.add('hidden');
      } else {
        exportLeadsBtn.classList.add('hidden');
        openCreateModalBtn.classList.remove('hidden');
      }

      if (btn.dataset.tab === 'sectionsTab' && !sectionsLoaded) {
        sectionsLoaded = true;
        loadSectionsForPage(sectionsPageSelect.value);
      }
    });
  });

  // --- INITIAL CHECK ---
  checkExistingAuth();

})();
