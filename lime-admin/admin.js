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

    const res = await apiRequest(`${API_BASE}/auth/login`, {
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
      const viewUrl = `../event.html?id=${encodeURIComponent(e.id)}`;

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

    const res = await apiRequest(`${API_BASE}/events/${encodeURIComponent(id)}`, {
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
    const res = await apiRequest(`${API_BASE}/events/${encodeURIComponent(id)}`, {
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
      res = await apiRequest(`${API_BASE}/events/${encodeURIComponent(editId)}`, {
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
      const haystack = `${lead.name} ${lead.email} ${lead.phone} ${lead.eventTitle}`.toLowerCase();
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

      return `
        <tr>
          <td style="font-size:12px; color:var(--ink-500);">${dateStr}</td>
          <td><strong>${r.name || '—'}</strong></td>
          <td><a href="https://wa.me/${(r.phone || '').replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--primary); font-weight:600; text-decoration:underline;">${r.phone || '—'}</a></td>
          <td><a href="mailto:${r.email}" style="color:var(--ink-700);">${r.email || '—'}</a></td>
          <td><span style="font-size:12px; font-weight:600;">${r.eventTitle || r.eventId || '—'}</span></td>
          <td><span style="background:#F1F5F9; padding:3px 8px; border-radius:var(--r-pill); font-size:11.5px; font-weight:600;">${r.goal || 'General'}</span></td>
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

  const sectionsPageSelect = document.getElementById('sectionsPageSelect');
  const sectionsFieldsContainer = document.getElementById('sectionsFieldsContainer');
  let sectionsLoaded = false;

  async function loadSectionsForPage(page) {
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

  // --- GLOBAL SECTIONS (reusable blocks shared across pages) ---
  const globalSectionsList = document.getElementById('globalSectionsList');
  let globalSectionsLoaded = false;

  // Same rendering logic as assets/section-loader.js, duplicated here so the
  // admin preview matches exactly what visitors see. Keep both in sync when
  // adding a new section type.
  const GLOBAL_SECTION_RENDERERS = {
    // Preview-only: rewrite root-relative asset paths so images resolve
    // correctly from inside /lime-admin/ (live pages already sit at root).
    'raw-html': function (data) { return (data.html || '').replace(/(src|href)="assets\//g, '$1="../assets/'); },
    'video-testimonials': function (data) {
      var items = Array.isArray(data.items) ? data.items : [];
      var cards = items.map(function (v) {
        var alt = (v.name || '') + (v.role ? ' - ' + v.role : '');
        return (
          '<div class="lid-video-card">' +
            '<img src="../' + v.photo + '" alt="' + alt.replace(/"/g, '&quot;') + '" class="lid-video-poster" loading="lazy">' +
            '<div class="lid-play-pill">&#9654; Watch Video</div>' +
          '</div>'
        );
      }).join('');
      return (
        '<div class="lid-testi-head"><h2>' + (data.heading || '') + '</h2><p>' + (data.subhead || '') + '</p></div>' +
        '<div class="lid-video-carousel-wrap">' +
          '<div class="lid-video-grid">' + cards + '</div>' +
          '<button type="button" class="lid-carousel-arrow lid-carousel-prev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>' +
          '<button type="button" class="lid-carousel-arrow lid-carousel-next" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>' +
        '</div>' +
        '<div class="lid-video-cta-wrap"><a href="#book-seat" class="btn btn-primary">Start Your 3-Day Trial</a></div>'
      );
    }
  };

  function renderPreviewFrame(html) {
    var iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%; border:1px solid var(--border, #e5e5e5); border-radius:10px; background:#fff;';
    iframe.srcdoc =
      '<!DOCTYPE html><html><head><link rel="stylesheet" href="../assets/style.css">' +
      '<style>body{margin:0;padding:24px;font-family:Poppins,sans-serif;}</style></head>' +
      '<body>' + html + '</body></html>';
    iframe.addEventListener('load', function () {
      try {
        var doc = iframe.contentDocument;
        iframe.style.height = Math.max(120, doc.body.scrollHeight + 40) + 'px';
      } catch (e) { iframe.style.height = '320px'; }
    });
    return iframe;
  }

  // Structured editor for the "video-testimonials" type: heading, subhead,
  // and a repeatable list of {name, role, photo} rows.
  function videoTestimonialsEditorHTML(name, data) {
    var items = Array.isArray(data.items) ? data.items : [];
    var rows = items.map(function (v, i) {
      return `
        <div class="form-grid-3 gs-item-row" data-idx="${i}" style="margin-bottom:10px; align-items:end;">
          <div class="form-field"><label>Name</label><input type="text" class="form-input gs-item-name" value="${(v.name || '').replace(/"/g, '&quot;')}"></div>
          <div class="form-field"><label>Role / Company</label><input type="text" class="form-input gs-item-role" value="${(v.role || '').replace(/"/g, '&quot;')}"></div>
          <div class="form-field"><label>Photo path (assets/...)</label><input type="text" class="form-input gs-item-photo" value="${(v.photo || '').replace(/"/g, '&quot;')}"></div>
        </div>`;
    }).join('');

    return `
      <div class="form-field" style="margin-bottom:14px;">
        <label>Heading (HTML allowed, e.g. &lt;span&gt; for accent color)</label>
        <input type="text" class="form-input gs-heading" value="${(data.heading || '').replace(/"/g, '&quot;')}">
      </div>
      <div class="form-field" style="margin-bottom:14px;">
        <label>Subheading</label>
        <input type="text" class="form-input gs-subhead" value="${(data.subhead || '').replace(/"/g, '&quot;')}">
      </div>
      <div class="gs-items-wrap">${rows}</div>
      <button type="button" class="btn-admin-secondary btn-sm-action gs-add-item" style="margin-top:6px;">+ Add Person</button>
    `;
  }

  function collectVideoTestimonialsData(card) {
    var items = [];
    card.querySelectorAll('.gs-item-row').forEach(function (row) {
      items.push({
        name: row.querySelector('.gs-item-name').value.trim(),
        role: row.querySelector('.gs-item-role').value.trim(),
        photo: row.querySelector('.gs-item-photo').value.trim()
      });
    });
    return {
      type: 'video-testimonials',
      heading: card.querySelector('.gs-heading').value,
      subhead: card.querySelector('.gs-subhead').value,
      items: items
    };
  }

  async function loadGlobalSections() {
    globalSectionsList.innerHTML = '<p class="empty-sub">Loading...</p>';
    const res = await apiRequest(`${API_BASE}/sections`, { method: 'GET' });
    const sections = (res.success && res.sections) ? res.sections : {};
    const names = Object.keys(sections);

    if (names.length === 0) {
      globalSectionsList.innerHTML = '<p class="empty-sub">No global sections registered yet.</p>';
      return;
    }

    globalSectionsList.innerHTML = names.map(name => `
      <div class="table-card gs-card" data-name="${name}" style="padding:22px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div>
            <h3 style="margin:0 0 2px; font-size:16px;">${name}</h3>
            <span class="empty-sub" style="font-size:12px;">Type: ${sections[name].type || 'unknown'}</span>
          </div>
          <span class="cms-save-status" data-gs-status="${name}" style="font-size:12.5px;"></span>
        </div>
        <div class="gs-editor" data-editor-for="${name}"></div>
        <div style="display:flex; gap:10px; margin-top:16px;">
          <button type="button" class="btn-admin-primary gs-save-btn" data-name="${name}">Save &amp; Publish Everywhere</button>
        </div>
        <div style="margin-top:18px;">
          <div class="empty-sub" style="font-size:12px; margin-bottom:6px;">Live preview (how it renders on any page):</div>
          <div class="gs-preview" data-preview-for="${name}"></div>
        </div>
      </div>
    `).join('');

    names.forEach(name => {
      const data = sections[name];
      const card = globalSectionsList.querySelector(`.gs-card[data-name="${CSS.escape(name)}"]`);
      const editorEl = card.querySelector('.gs-editor');
      const previewEl = card.querySelector('.gs-preview');

      if (data.type === 'video-testimonials') {
        editorEl.innerHTML = videoTestimonialsEditorHTML(name, data);
      } else if (data.type === 'raw-html') {
        const escaped = (data.html || '').replace(/</g, '&lt;');
        editorEl.innerHTML = `<p class="empty-sub">Raw HTML &mdash; edit carefully, this is injected as-is on every page that uses it.</p>
          <textarea class="form-textarea gs-raw-html" rows="16" style="font-family:monospace; font-size:12.5px;">${escaped}</textarea>`;
      } else {
        editorEl.innerHTML = `<p class="empty-sub">No structured editor yet for type "${data.type}". Raw JSON:</p>
          <textarea class="form-textarea gs-raw-json" rows="6">${JSON.stringify(data, null, 2)}</textarea>`;
      }

      const renderer = GLOBAL_SECTION_RENDERERS[data.type];
      if (renderer) previewEl.appendChild(renderPreviewFrame(renderer(data)));
      else previewEl.innerHTML = '<p class="empty-sub">No preview renderer for this type.</p>';

      const addBtn = card.querySelector('.gs-add-item');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const wrap = card.querySelector('.gs-items-wrap');
          const idx = wrap.querySelectorAll('.gs-item-row').length;
          const div = document.createElement('div');
          div.innerHTML = `
            <div class="form-grid-3 gs-item-row" data-idx="${idx}" style="margin-bottom:10px; align-items:end;">
              <div class="form-field"><label>Name</label><input type="text" class="form-input gs-item-name" value=""></div>
              <div class="form-field"><label>Role / Company</label><input type="text" class="form-input gs-item-role" value=""></div>
              <div class="form-field"><label>Photo path (assets/...)</label><input type="text" class="form-input gs-item-photo" value=""></div>
            </div>`;
          wrap.appendChild(div.firstElementChild);
        });
      }

      card.querySelector('.gs-save-btn').addEventListener('click', async () => {
        const btn = card.querySelector('.gs-save-btn');
        const statusEl = card.querySelector(`[data-gs-status="${name}"]`);
        btn.disabled = true;
        const prevLabel = btn.textContent;
        btn.textContent = 'Saving...';

        let payload;
        const rawHtmlTextarea = editorEl.querySelector('.gs-raw-html');
        const rawJsonTextarea = editorEl.querySelector('.gs-raw-json');
        if (rawHtmlTextarea) {
          payload = { type: 'raw-html', html: rawHtmlTextarea.value };
        } else if (rawJsonTextarea) {
          try { payload = JSON.parse(rawJsonTextarea.value); }
          catch (e) { statusEl.textContent = 'Invalid JSON'; statusEl.style.color = '#dc2626'; btn.disabled = false; btn.textContent = prevLabel; return; }
        } else {
          payload = collectVideoTestimonialsData(card);
        }

        const saveRes = await apiRequest(`${API_BASE}/sections?name=${encodeURIComponent(name)}`, { method: 'PUT', body: payload });

        btn.disabled = false;
        btn.textContent = prevLabel;

        if (saveRes.success) {
          statusEl.textContent = '✓ Saved — live on every page using it';
          statusEl.style.color = '#16a34a';
          showToast('Global section updated');
          const renderer2 = GLOBAL_SECTION_RENDERERS[payload.type];
          if (renderer2) { previewEl.innerHTML = ''; previewEl.appendChild(renderPreviewFrame(renderer2(payload))); }
        } else {
          statusEl.textContent = saveRes.error || 'Save failed';
          statusEl.style.color = '#dc2626';
        }
        setTimeout(() => { statusEl.textContent = ''; }, 5000);
      });
    });
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
      if (btn.dataset.tab === 'globalSectionsTab' && !globalSectionsLoaded) {
        globalSectionsLoaded = true;
        loadGlobalSections();
      }
    });
  });

  // --- INITIAL CHECK ---
  checkExistingAuth();

})();
