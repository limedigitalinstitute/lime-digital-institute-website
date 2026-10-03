// Lime Digital Institute — Interactive Site Logic

// FAQ items (.faq2, .faq-item, .faq-box): each toggles independently — global for inline onclick
function toggleFaq(btn) {
  const card = btn.closest('.faq2') || btn.closest('.faq-item') || btn.closest('.faq-box');
  if (!card) return;
  const open = card.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
}

// ===== UTM CAPTURE (session-persisted) + TRIAL POPUP -> ZOHO (Learn Digital
// Marketing) BACKGROUND SUBMIT =====
// The Trial popup keeps its own custom HTML/CSS (full visual control); this
// posts its data to Zoho in the background via a hidden iframe, same
// technique as every other form on the site.
const ZOHO_TRIAL_FORM_URL = 'https://forms.zohopublic.in/LimeDigital/form/MetaAdsForm/formperma/oTSSTfG3vvVyKolzsHdsx6xIamRyGQrb0LN7Vu57pzw/htmlRecords/submit';
(function captureUTMs() {
  try {
    const params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      const val = params.get(key);
      if (val) sessionStorage.setItem('lime_' + key, val);
    });
  } catch (e) {}
})();
function getStoredUTMs() {
  const get = (k) => { try { return sessionStorage.getItem('lime_' + k) || ''; } catch (e) { return ''; } };
  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_term: get('utm_term'),
    utm_content: get('utm_content')
  };
}
function submitTrialLeadToZoho(lead) {
  try {
    const utms = getStoredUTMs();
    const rawName = (lead.name || '').trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0] || 'Applicant';
    const lastName = parts.slice(1).join(' ') || '.';

    const countryDigits = (lead.country_code || '+91').replace(/[^0-9]/g, '') || '91';
    const phoneDigits = (lead.phone || '').replace(/[^0-9]/g, '');
    const fullPhone = countryDigits + phoneDigits;

    const fields = {
      Name_First: firstName,
      Name_Last: lastName,
      PhoneNumber_countrycode: fullPhone,
      PhoneNumber_countrycodeval: '+' + countryDigits,
      zf_referrer_name: (window.location.href || '').slice(0, 1500),
      zf_redirect_url: '',
      zc_gad: '',
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_term: utms.utm_term,
      utm_content: utms.utm_content
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'trial_signup_submit', form_name: lead.utm_form || 'modal_3day_free_trial', ...utms });

    let iframe = document.getElementById('zoho_trial_bg_iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'zoho_trial_bg_iframe';
      iframe.name = 'zoho_trial_bg_iframe';
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;border:none;';
      document.body.appendChild(iframe);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = ZOHO_TRIAL_FORM_URL;
    form.target = 'zoho_trial_bg_iframe';
    form.enctype = 'multipart/form-data';
    form.acceptCharset = 'UTF-8';
    form.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value || '';
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => { try { form.remove(); } catch (e) {} }, 3000);
  } catch (err) {
    console.warn('[Lime Leads] Trial form Zoho submit error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {

  // ===== NAV SCROLL STATE =====
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  // ===== SCROLL REVEAL ANIMATIONS =====
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (revealEls.length > 0) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  // ===== ANIMATED NUMERIC COUNTERS =====
  const counters = document.querySelectorAll('.counter');
  if (counters.length > 0) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.target);
        const decimals = parseInt(el.dataset.decimal || '0');
        const dur = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  // ===== INTERACTIVE CURRICULUM EXPLORER TABS =====
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const activePane = document.getElementById(targetTab);
        if (activePane) activePane.classList.add('active');
      });
    });
  }

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (item.classList.contains('open') && a) {
      a.style.maxHeight = a.scrollHeight + 'px';
    }
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(o => {
          o.classList.remove('open');
          const pane = o.querySelector('.faq-a');
          if (pane) pane.style.maxHeight = null;
        });
        if (!isOpen && a) {
          item.classList.add('open');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    }
  });

  // ===== MOBILE MENU TOGGLE (full-screen overlay) =====
  const burger = document.querySelector('.nav-burger');
  const mobileNavLinks = document.querySelector('.nav-links');

  function closeMobileNav() {
    if (!mobileNavLinks || !burger) return;
    mobileNavLinks.classList.remove('mobile-open');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-nav-open');
    mobileNavLinks.querySelectorAll('li.mega-open').forEach(li => li.classList.remove('mega-open'));
  }

  if (burger && mobileNavLinks) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNavLinks.classList.contains('mobile-open');
      if (isOpen) {
        closeMobileNav();
      } else {
        mobileNavLinks.classList.add('mobile-open');
        burger.classList.add('active');
        burger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('mobile-nav-open');
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) closeMobileNav();
    });
  }

  // ===== SPOTLIGHT MOUSE CURSOR GLOW =====
  document.querySelectorAll('.spotlight').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ===== LEAD CAPTURE / 3-DAY FREE TRIAL MODAL =====
  function openTrialModal(courseName, sourceText) {
    const modal = document.getElementById('leadModal');
    if (modal) {
      const form = document.getElementById('modalForm') || modal.querySelector('form');
      if (form) {
        let utm = 'modal_3day_free_trial';
        if (sourceText) {
          const lower = sourceText.toLowerCase();
          if (lower.includes('hold')) utm = 'modal_trial_hold_seat';
          else if (lower.includes('demo')) utm = 'modal_trial_free_demo';
          else if (lower.includes('comparison') || lower.includes('potential')) utm = 'modal_trial_comparison';
          else if (lower.includes('start') || lower.includes('trial')) utm = 'modal_trial_start_trial';
        }
        form.dataset.utmForm = utm;
      }
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.initCountryPickers) window.initCountryPickers();
    }
  }
  window.openTrialModal = openTrialModal;
  window.openModal = function(courseName, sourceText) {
    openTrialModal(courseName, sourceText);
  };

  function closeModal() {
    const modal = document.getElementById('leadModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  window.closeModal = closeModal;
  window.closeTrialModal = closeModal;

  const modalCloseBtn = document.getElementById('modalClose');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  const modalOverlay = document.getElementById('leadModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  const modalForm = document.getElementById('modalForm');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = modalForm.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : 'Claim Free Trial Pass →';
      if (btn) {
        btn.innerHTML = 'Reserving Seat...';
        btn.disabled = true;
      }

      const name = (modalForm.querySelector('input[name="name"]')?.value || '').trim();
      const countryCode = (modalForm.querySelector('select[name="country_code"]')?.value || '+91').trim();
      const phone = (modalForm.querySelector('input[name="phone"]')?.value || '').trim();
      const utmForm = modalForm.dataset.utmForm || 'modal_3day_free_trial';

      submitTrialLeadToZoho({ name, phone, country_code: countryCode, utm_form: utmForm });

      setTimeout(() => {
        if (btn) {
          btn.textContent = original;
          btn.disabled = false;
        }
        modalForm.reset();
        closeModal();
        window.location.href = 'thank-you?type=trial&name=' + encodeURIComponent(name);
      }, 450);
    });
  }

  // ===== CONTACT FORM SUBMISSION =====
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : 'Submit';
      if (btn) {
        btn.textContent = '✔ Request Sent — Expect a call within 2 hours';
        btn.disabled = true;
      }

      const name = contactForm.querySelector('#name')?.value || contactForm.querySelector('input[name="name"]')?.value || '';
      const phone = contactForm.querySelector('#phone')?.value || contactForm.querySelector('input[name="phone"]')?.value || '';
      const email = contactForm.querySelector('#email')?.value || contactForm.querySelector('input[name="email"]')?.value || '';
      const message = contactForm.querySelector('#message')?.value || '';

      if (window.LimeLeadCollector) {
        window.LimeLeadCollector.submitLead({
          name: name,
          phone: phone,
          email: email,
          message: message,
          form_name: 'Contact Page - Book Free Counselling Call',
          utm_form: 'contact_page_counselling',
          cta_text: original.trim(),
          button_id: 'btn-contact-submit'
        });
      }

      setTimeout(() => {
        if (btn) {
          btn.textContent = original;
          btn.disabled = false;
        }
        contactForm.reset();
      }, 3000);
    });
  }

  // ===== PROGRAM HERO FORMS (Master's "pgHeroForm" / Bachelor's "heroForm") =====
  function wireHeroLeadForm(formId, btnId, formName, utmForm) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = document.getElementById(btnId) || form.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : 'Submit';
      if (btn) {
        btn.textContent = '✔ Request Sent — Expect a call within 2 hours';
        btn.disabled = true;
      }

      const name = (form.querySelector('input[name="name"]')?.value || '').trim();
      const countryCode = (form.querySelector('select[name="country_code"]')?.value || '+91').trim();
      const phone = (form.querySelector('input[name="phone"]')?.value || '').trim();
      const email = (form.querySelector('input[name="email"]')?.value || '').trim();
      const extra = form.querySelector('select[name="background"], select[name="status"]')?.value || '';

      if (window.LimeLeadCollector) {
        window.LimeLeadCollector.submitLead({
          name: name,
          phone: phone,
          country_code: countryCode,
          email: email,
          course: extra,
          form_name: formName,
          utm_form: utmForm,
          cta_text: original.trim(),
          button_id: btnId
        });
      }

      setTimeout(() => {
        if (btn) {
          btn.textContent = original;
          btn.disabled = false;
        }
        form.reset();
        window.location.href = 'thank-you?type=trial&name=' + encodeURIComponent(name);
      }, 450);
    });
  }
  wireHeroLeadForm('pgHeroForm', 'pgHeroSubmitBtn', "Master's Program Hero - Apply for Executive Screening", 'hero_masters_executive_screening');
  wireHeroLeadForm('heroForm', 'heroSubmitBtn', 'Bachelor\'s Program Hero - Request Degree Prospectus', 'hero_bachelors_degree_prospectus');

  // ===== LID VIDEO TESTIMONIAL PLAY/PAUSE LOGIC =====
  document.querySelectorAll('.lid-video-card').forEach(card => {
    const video = card.querySelector('video');
    const pill = card.querySelector('.lid-play-pill');

    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (!video) return;

      if (video.paused) {
        // Pause all other videos first
        document.querySelectorAll('.lid-video-card').forEach(otherCard => {
          const otherVid = otherCard.querySelector('video');
          const otherPill = otherCard.querySelector('.lid-play-pill');
          if (otherVid && !otherVid.paused) {
            otherVid.pause();
            otherCard.classList.remove('playing');
            if (otherPill) otherPill.innerHTML = '▶ Watch Video';
          }
        });

        // Play this video
        video.play();
        card.classList.add('playing');
        if (pill) pill.innerHTML = '❚❚ Pause Video';
      } else {
        // Pause this video
        video.pause();
        card.classList.remove('playing');
        if (pill) pill.innerHTML = '▶ Watch Video';
      }
    });
  });

  // ===== LID CURRICULUM ACCORDION TOGGLE =====
  document.querySelectorAll('.lid-curr-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.lid-curr-card');
      if (card) {
        card.classList.toggle('open');
      }
    });
  });

  // ===== 2-COLUMN UNLOCK SYLLABUS MODAL (MATCHING IMAGE 5) =====
  // ===== 2-COLUMN UNLOCK SYLLABUS / CURRICULUM ROUTING =====
  window.openUnlockModal = function(courseName) {
    if (typeof openCurriculumModal === 'function') {
      openCurriculumModal(courseName, 'Unlock Full Syllabus');
      return;
    }
    const modal = document.getElementById('unlockModal');
    if (modal) {
      if (courseName) {
        const select = modal.querySelector('select:not([name="country_code"])');
        if (select) select.value = courseName;
      }
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.initCountryPickers) window.initCountryPickers();
    }
  };

  window.closeUnlockModal = function() {
    const modal = document.getElementById('unlockModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (typeof closeCurriculumModal === 'function') closeCurriculumModal();
  };

  const unlockModal = document.getElementById('unlockModal');
  if (unlockModal) {
    unlockModal.addEventListener('click', (e) => {
      if (e.target === unlockModal) closeUnlockModal();
    });
  }

  window.handleUnlockSubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const name = (form.querySelector('input[name="name"]')?.value || document.getElementById('unlockName')?.value || '').trim();
    const countryCode = (form.querySelector('select[name="country_code"]')?.value || '+91').trim();
    const phone = (form.querySelector('input[name="phone"]')?.value || document.getElementById('unlockPhone')?.value || '').trim();
    const email = (form.querySelector('input[name="email"]')?.value || document.getElementById('unlockEmail')?.value || '').trim();
    const course = (form.querySelector('select:not([name="country_code"])')?.value || '').trim();
    const btn = form.querySelector('button[type="submit"]');
    const ctaText = btn ? btn.textContent.trim() : 'Unlock Full Syllabus';

    if (btn) {
      btn.innerHTML = 'Sending Syllabus...';
      btn.disabled = true;
    }

    if (window.LimeLeadCollector) {
      window.LimeLeadCollector.submitLead({
        name: name,
        phone: phone,
        country_code: countryCode,
        email: email,
        course: course,
        form_name: 'Unlock Full Syllabus Button form Popup',
        utm_form: 'modal_curriculum_unlock_syllabus',
        cta_text: ctaText,
        button_id: 'btn-unlock-submit'
      });
    }

    try {
      window.open(BROCHURE_PDF, '_blank', 'noopener');
    } catch(err) {}

    setTimeout(() => {
      closeUnlockModal();
      if (form) form.reset();
      window.location.href = 'thank-you?type=brochure&name=' + encodeURIComponent(name);
    }, 450);
  };

  // ===== MEGA MENU (Courses / Students Centric / Learning Centre / More) =====
  const megaItems = document.querySelectorAll('.nav-links li.has-mega');
  let backdrop = document.querySelector('.mega-backdrop');
  if (!backdrop && megaItems.length) {
    backdrop = document.createElement('div');
    backdrop.className = 'mega-backdrop';
    document.body.appendChild(backdrop);
  }

  function closeAllMega() {
    megaItems.forEach(li => li.classList.remove('mega-open'));
    if (backdrop) backdrop.classList.remove('active');
  }

  megaItems.forEach(li => {
    const trigger = li.querySelector('.mega-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = li.classList.contains('mega-open');
      closeAllMega();
      if (!isOpen) {
        li.classList.add('mega-open');
        if (backdrop) backdrop.classList.add('active');
      }
    });
  });

  if (backdrop) backdrop.addEventListener('click', closeAllMega);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllMega(); });
  window.addEventListener('resize', closeAllMega);

  // ===== CAMPUS VISIT POPUP =====
  const campusModal = document.getElementById('campusModal');
  if (campusModal) {
    const openCampus = () => {
      campusModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    const closeCampus = () => {
      campusModal.classList.remove('active');
      document.body.style.overflow = '';
    };
    document.querySelectorAll('.open-campus-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); openCampus(); });
    });
    const closeBtn = campusModal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCampus);
    campusModal.addEventListener('click', (e) => { if (e.target === campusModal) closeCampus(); });

    const campusForm = document.getElementById('campusForm');
    if (campusForm) {
      campusForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = campusForm.querySelector('button[type="submit"]');
        const original = btn ? btn.textContent : 'Request Visit';
        if (btn) {
          btn.textContent = '✔ Visit Requested — We\'ll Confirm on WhatsApp';
          btn.disabled = true;
        }

        const name = campusForm.querySelector('input[name="name"]')?.value || '';
        const phone = campusForm.querySelector('input[name="phone"]')?.value || '';
        const email = campusForm.querySelector('input[name="email"]')?.value || '';
        const date = campusForm.querySelector('input[name="visit_date"]')?.value || '';

        if (window.LimeLeadCollector) {
          window.LimeLeadCollector.submitLead({
            name: name,
            phone: phone,
            email: email,
            visit_date: date,
            form_name: 'Campus Visit Request',
            utm_form: 'campus_visit_popup',
            cta_text: original.trim(),
            button_id: 'btn-campus-submit'
          });
        }

        setTimeout(() => {
          if (btn) {
            btn.textContent = original;
            btn.disabled = false;
          }
          campusForm.reset();
          closeCampus();
        }, 2500);
      });
    }
  }

});

// ===== HOME PAGE: 16-MODULE CURRICULUM ACCORDION (ported from courses.html) =====

// Curriculum accordion: one card open at a time
function toggleModule(btn) {
  const card = btn.closest('.cur-card');
  const list = card.closest('.cur-list');
  const willOpen = !card.classList.contains('open');
  list.querySelectorAll('.cur-card.open').forEach(c => {
    c.classList.remove('open');
    c.querySelector('.cur-head').setAttribute('aria-expanded', 'false');
  });
  if (willOpen) {
    card.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// Curriculum: reveal all 16 modules / collapse back to the preview
function toggleCurriculum() {
  const list = document.getElementById('curList');
  const btn = document.getElementById('curToggle');
  if (!list || !btn) return;
  const collapsed = list.classList.toggle('is-collapsed');
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.querySelector('.cur-toggle-label').textContent =
    collapsed ? 'View Complete Curriculum' : 'View Less';
  if (collapsed) list.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// Tools: reveal all 70+ tools / collapse back to preview
function toggleTools() {
  const grid = document.getElementById('toolsGrid');
  const btn = document.getElementById('toolsToggle');
  const section = document.getElementById('tools');
  if (!grid || !btn) return;
  const isNowCollapsed = grid.classList.toggle('is-collapsed');
  btn.setAttribute('aria-expanded', String(!isNowCollapsed));
  const label = btn.querySelector('.tools-toggle-label');
  if (label) {
    label.textContent = isNowCollapsed ? 'View Complete Tools' : 'View Less';
  }
  if (isNowCollapsed) {
    if (section) {
      section.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      grid.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}
window.toggleTools = toggleTools;

// ===== CURRICULUM POP-UP MODAL (DOWNLOAD COMPLETE CURRICULUM - IMAGE 2) =====
function ensureCurriculumModalExists() {
  let modal = document.getElementById('curriculumModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'curr-modal-overlay';
  modal.id = 'curriculumModal';
  modal.innerHTML = `
    <div class="curr-modal-card">
      <button type="button" class="curr-modal-close" onclick="closeCurriculumModal()" aria-label="Close Modal">&times;</button>
      <div class="curr-modal-grid">
        <div class="curr-modal-left">
          <div class="curr-modal-thumb">
            <img src="assets/brochure-cover.jpg" alt="Lime Digital Institute Course Brochure" loading="lazy">
          </div>
        </div>
        <div class="curr-modal-right">
          <div class="curr-modal-badge">Course Brochure</div>
          <div class="curr-modal-head">
            <h3>Download Complete Curriculum</h3>
            <p>Get the detailed 16-module syllabus, AI tools &amp; fee structure on WhatsApp &amp; email.</p>
          </div>
          <form class="curr-modal-form lead-form" id="curriculumPopupForm" data-form-name="Download Complete Curriculum (Popup form)" data-redirect-course="Digital Marketing Professional" onsubmit="handlePopupFormSubmit(event)">
            <div class="curr-form-group">
              <label>First Name *</label>
              <input type="text" id="popName" name="name" placeholder="e.g. Rahul" required>
            </div>
            <div class="curr-form-group">
              <label>Phone Number (WhatsApp) *</label>
              <div class="curr-phone-row">
                <select name="country_code" id="popCountryCode" class="curr-phone-prefix curr-country-select" aria-label="Country Code">
                  <option value="+91" selected>🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+1">🇨🇦 +1</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+966">🇸🇦 +966</option>
                  <option value="+974">🇶🇦 +974</option>
                  <option value="+968">🇴🇲 +968</option>
                  <option value="+965">🇰🇼 +965</option>
                  <option value="+973">🇧🇭 +973</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+64">🇳🇿 +64</option>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+27">🇿🇦 +27</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+977">🇳🇵 +977</option>
                  <option value="+880">🇧🇩 +880</option>
                  <option value="+94">🇱🇰 +94</option>
                </select>
                <input type="tel" id="popPhone" name="phone" placeholder="Enter phone number" pattern="[0-9]{7,15}" maxlength="15" required>
              </div>
              <div class="curr-field-hint">You will receive updates on WhatsApp</div>
            </div>
            <div class="curr-form-group">
              <label>Email Address *</label>
              <input type="email" id="popEmail" name="email" placeholder="e.g. rahul@example.com" required>
            </div>
            <label class="curr-consent">
              <input type="checkbox" name="consent" checked required>
              <span>I agree to receive course updates from Lime Digital Institute on WhatsApp &amp; email.</span>
            </label>
            <button type="submit" class="curr-btn-submit">
              Download Brochure PDF &rarr;
            </button>
            <div class="curr-trust-row">
              <span><strong class="tick">&#10003;</strong> 100% data privacy</span>
              <span><strong class="tick">&#10003;</strong> 400+ enrolled</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCurriculumModal();
  });
  document.body.appendChild(modal);
  return modal;
}

function openCurriculumModal(courseName, sourceText) {
  const modal = ensureCurriculumModalExists();
  if (modal) {
    const form = modal.querySelector('form');
    if (form) {
      let utm = 'modal_complete_curriculum';
      if (sourceText) {
        const lower = sourceText.toLowerCase();
        if (lower.includes('syllabus')) utm = 'modal_curriculum_unlock_syllabus';
        else if (lower.includes('navbar') || lower.includes('nav')) utm = 'modal_curriculum_navbar';
        else if (lower.includes('placement') || lower.includes('report')) utm = 'modal_curriculum_placements';
        else if (lower.includes('brochure')) utm = 'modal_curriculum_brochure_btn';
      }
      form.dataset.utmForm = utm;
      if (courseName && form.dataset) form.dataset.redirectCourse = courseName;
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.initCountryPickers) window.initCountryPickers();
  }
}
window.openCurriculumModal = openCurriculumModal;

function closeCurriculumModal() {
  const modal = document.getElementById('curriculumModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
window.closeCurriculumModal = closeCurriculumModal;

document.addEventListener('DOMContentLoaded', () => {
  const curModal = document.getElementById('curriculumModal');
  if (curModal) {
    curModal.addEventListener('click', (e) => {
      if (e.target === curModal) closeCurriculumModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCurriculumModal();
  });
});

function handlePopupFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const name = (document.getElementById('popName')?.value || form.querySelector('input[name="name"]')?.value || '').trim();
  const countryCode = (form.querySelector('select[name="country_code"]')?.value || document.getElementById('popCountryCode')?.value || '+91').trim();
  const phone = (document.getElementById('popPhone')?.value || form.querySelector('input[name="phone"]')?.value || '').trim();
  const email = (document.getElementById('popEmail')?.value || form.querySelector('input[name="email"]')?.value || '').trim();
  const btn = form.querySelector('button[type="submit"]');
  const ctaText = btn ? btn.textContent.trim() : 'Download Brochure PDF →';

  if (btn) {
    btn.innerHTML = 'Sending Brochure...';
    btn.disabled = true;
  }

  const utmForm = form.dataset.utmForm || 'modal_complete_curriculum';

  if (window.LimeLeadCollector) {
    window.LimeLeadCollector.submitLead({
      name: name,
      phone: phone,
      country_code: countryCode,
      email: email,
      form_name: 'Download Complete Curriculum (Popup form)',
      utm_form: utmForm,
      cta_text: ctaText,
      button_id: 'btn-curriculum-modal-submit',
      course: 'Digital Marketing Professional'
    });
  }

  try {
    window.open(BROCHURE_PDF, '_blank', 'noopener');
  } catch (err) {}

  setTimeout(() => {
    closeCurriculumModal();
    if (form) form.reset();
    window.location.href = 'thank-you?type=brochure&name=' + encodeURIComponent(name);
  }, 450);
}
window.handlePopupFormSubmit = handlePopupFormSubmit;

// Sticky brochure rail -> opens the brochure PDF and records the lead
const BROCHURE_PDF = 'assets/brochure/Lime-Digital-Curriculum-V5.pdf';

function handleBrochureDownload() {
  window.open(BROCHURE_PDF, '_blank', 'noopener');
}
window.handleBrochureDownload = handleBrochureDownload;

function handleBrochureSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const name  = (document.getElementById('brochureName') ? document.getElementById('brochureName').value : form.querySelector('input[name="name"]')?.value || '').trim();
  const email = (document.getElementById('brochureEmail') ? document.getElementById('brochureEmail').value : form.querySelector('input[name="email"]')?.value || '').trim();
  const phone = (document.getElementById('brochurePhone') ? document.getElementById('brochurePhone').value : form.querySelector('input[name="phone"]')?.value || '').trim();
  const countryCode = (document.getElementById('brochureCountryCode')?.value || form.querySelector('select[name="country_code"]')?.value || '+91').trim();
  const btn = form.querySelector('.btn-brochure-submit') || form.querySelector('button[type="submit"]');
  const ctaText = btn ? btn.textContent.trim() : 'Download Brochure PDF →';

  // keep the existing curriculum-modal fields in sync
  if (document.getElementById('popName'))  document.getElementById('popName').value  = name;
  if (document.getElementById('popEmail')) document.getElementById('popEmail').value = email;
  if (document.getElementById('popPhone')) document.getElementById('popPhone').value = phone;

  if (btn) {
    btn.innerHTML = 'Sending Brochure...';
    btn.disabled = true;
  }

  const isCourses = window.location.pathname.includes('courses');
  const utmForm = isCourses ? 'courses_sidebar_brochure' : 'index_sidebar_brochure';

  if (window.LimeLeadCollector) {
    window.LimeLeadCollector.submitLead({
      name: name,
      phone: phone,
      country_code: countryCode,
      email: email,
      form_name: 'Sidebar Download Brochure Form',
      utm_form: utmForm,
      cta_text: ctaText,
      button_id: 'btn-brochure-submit',
      course: 'Digital Marketing Professional'
    });
  }

  try {
    window.open(BROCHURE_PDF, '_blank', 'noopener');
  } catch (err) {}

  setTimeout(() => {
    if (form) form.reset();
    window.location.href = 'thank-you?type=brochure&name=' + encodeURIComponent(name);
  }, 450);
}
window.handleBrochureSubmit = handleBrochureSubmit;

// ===== UNIVERSAL BUTTON CLICK ROUTER =====
// Maps "Unlock Full Syllabus" & "[Download Brochure PDF →]" to Download Complete Curriculum (Image 2)
// Maps "Start Trial", "Hold Trial", and "Demo" to Start Your 3-Day Free Trial (Image 3)
document.addEventListener('click', (e) => {
  if (e.target.closest('.modal-close, .curr-modal-close, .unlock-modal-close, .lid-curr-header, .faq-head, [type="submit"], input, select, textarea, .lime-cp-trigger, .lime-cp-dropdown, .ag-accordion-head, .cur-head, .cur-toggle-btn, .campus-marquee-container, .brand-marquee-container')) {
    return;
  }

  const btn = e.target.closest('button, a.btn, a.nav-cta, .open-modal-btn, .btn-unlock, .sbb-download-btn, [data-modal], .potential-cta-btn, .lid-video-cta, .btn-know-more, .btn-unlock-syllabus');
  if (!btn) return;

  const text = (btn.textContent || '').trim().replace(/\s+/g, ' ');
  const lower = text.toLowerCase();
  const href = btn.getAttribute('href');

  if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
    if (!btn.classList.contains('open-modal-btn') && !btn.hasAttribute('data-modal') && !btn.classList.contains('btn-unlock') && !btn.classList.contains('btn-unlock-syllabus')) {
      return;
    }
  }

  const isBrochureOrSyllabus = 
    btn.classList.contains('btn-unlock') ||
    btn.classList.contains('btn-unlock-syllabus') ||
    btn.classList.contains('sbb-download-btn') ||
    btn.dataset.modal === 'curriculum' ||
    lower.includes('unlock full syllabus') ||
    lower.includes('download brochure') ||
    lower.includes('view curriculum') ||
    lower.includes('complete curriculum') ||
    lower.includes('brochure pdf') ||
    (lower.includes('brochure') && !lower.includes('trial') && !lower.includes('demo'));

  const isTrialOrDemo = 
    btn.dataset.modal === 'trial' ||
    lower.includes('start trial') ||
    lower.includes('start 3-day') ||
    lower.includes('3-day free trial') ||
    lower.includes('hold trial') ||
    lower.includes('hold your seat') ||
    lower.includes('hold seat') ||
    lower.includes('free demo') ||
    lower.includes('book demo') ||
    lower.includes('demo class') ||
    lower.includes('free trial') ||
    lower.includes('claim free trial');

  if (isBrochureOrSyllabus && !isTrialOrDemo) {
    e.preventDefault();
    const course = btn.getAttribute('data-course') || '';
    openCurriculumModal(course, text);
    return;
  }

  if (isTrialOrDemo) {
    e.preventDefault();
    const course = btn.getAttribute('data-course') || '';
    openTrialModal(course, text);
    return;
  }

  if (btn.classList.contains('open-modal-btn')) {
    e.preventDefault();
    if (lower.includes('brochure') || lower.includes('syllabus')) {
      openCurriculumModal(btn.getAttribute('data-course') || '', text);
    } else {
      openTrialModal(btn.getAttribute('data-course') || '', text);
    }
  }
});

// ===== ANTIGRAVITY STICKY REVEAL FOOTER =====
function initFooterReveal() {
  const footer = document.getElementById('antigravityFooter');
  const spacer = document.getElementById('footerRevealSpacer');
  const wrapper = document.getElementById('siteMainWrapper');
  if (!footer) return;

  function updateRevealMetrics() {
    const isDesktop = window.innerWidth > 768;
    const footerHeight = footer.offsetHeight;

    if (isDesktop) {
      if (spacer) {
        spacer.style.display = 'block';
        spacer.style.height = footerHeight + 'px';
      }
      if (wrapper) {
        wrapper.style.marginBottom = '0px';
      }
      footer.classList.remove('footer-flow');
    } else {
      if (spacer) {
        spacer.style.display = 'none';
        spacer.style.height = '0px';
      }
      if (wrapper) {
        wrapper.style.marginBottom = '0px';
      }
      footer.classList.add('footer-flow');
    }
  }

  function checkFooterInView() {
    const isDesktop = window.innerWidth > 768;
    const winH = window.innerHeight;
    if (isDesktop) {
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        if (rect.bottom < winH * 0.75) {
          document.body.classList.add('footer-revealed');
        } else {
          document.body.classList.remove('footer-revealed');
        }
      } else if (spacer) {
        const rect = spacer.getBoundingClientRect();
        if (rect.top < winH * 0.75) {
          document.body.classList.add('footer-revealed');
        } else {
          document.body.classList.remove('footer-revealed');
        }
      }
    } else {
      if (footer) {
        const rect = footer.getBoundingClientRect();
        if (rect.top < winH * 0.9) {
          document.body.classList.add('footer-revealed');
        } else {
          document.body.classList.remove('footer-revealed');
        }
      }
    }
  }

  updateRevealMetrics();
  checkFooterInView();
  window.addEventListener('scroll', checkFooterInView, { passive: true });
  window.addEventListener('resize', () => {
    updateRevealMetrics();
    checkFooterInView();
  }, { passive: true });
  window.addEventListener('load', () => {
    updateRevealMetrics();
    checkFooterInView();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateRevealMetrics();
      checkFooterInView();
    });
  }
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      updateRevealMetrics();
      checkFooterInView();
    }).observe(footer);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooterReveal);
} else {
  initFooterReveal();
}

// ===== WEEKLY LIVE SESSIONS COUNTDOWN TIMER =====
function initWeeklyLiveTimer() {
  const daysEl = document.getElementById('timerDays');
  const hoursEl = document.getElementById('timerHours');
  const minsEl = document.getElementById('timerMinutes');
  const secsEl = document.getElementById('timerSeconds');
  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function getNextSessionTarget() {
    // Live session schedule: Every Sunday at 20:00 (8:00 PM) IST
    const now = new Date();
    // Calculate IST time (UTC + 5:30)
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istNow = new Date(utcMs + (5.5 * 3600000));
    
    const currentDay = istNow.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const currentHour = istNow.getHours();
    const currentMinute = istNow.getMinutes();
    
    let daysUntilSunday = (7 - currentDay) % 7;
    if (currentDay === 0 && (currentHour > 20 || (currentHour === 20 && currentMinute >= 0))) {
      daysUntilSunday = 7;
    } else if (currentDay === 0 && currentHour < 20) {
      daysUntilSunday = 0;
    }
    
    const targetIST = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate() + daysUntilSunday, 20, 0, 0);
    const diffMs = targetIST.getTime() - istNow.getTime();
    return now.getTime() + diffMs;
  }

  let targetTime = getNextSessionTarget();

  function tick() {
    const now = Date.now();
    let diff = targetTime - now;

    if (diff <= 0) {
      targetTime = getNextSessionTarget();
      diff = targetTime - now;
    }
    if (diff < 0) diff = 0;

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  tick();
  setInterval(tick, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWeeklyLiveTimer);
} else {
  initWeeklyLiveTimer();
}

// Testimonial carousel (.testi-carousel): desktop prev/next arrows step
// through the same radio inputs the dots already drive.
function testiNav(btnOrDir, maybeDir) {
  const dir = typeof btnOrDir === 'number' ? btnOrDir : (typeof maybeDir === 'number' ? maybeDir : 1);
  const btn = (typeof btnOrDir === 'object' && btnOrDir && btnOrDir.nodeType) ? btnOrDir : null;
  const root = btn ? (btn.closest('.testi-carousel') || document) : document;
  const radios = Array.from(root.querySelectorAll('.testi-radio'));
  if (!radios.length) return;
  let i = 0;
  radios.forEach((r, idx) => { if (r.checked) i = idx; });
  let next = (i + dir + radios.length) % radios.length;
  const cards = root.querySelector('.testi-carousel-cards');
  if (cards) {
    cards.classList.remove('dir-next', 'dir-prev');
    void cards.offsetWidth;
    cards.classList.add(dir > 0 ? 'dir-next' : 'dir-prev');
  }
  radios[next].checked = true;
}
window.testiNav = testiNav;

// ===== GLOBAL SITE-WIDE MAINTENANCE MODAL POPUP =====
(function initMaintenanceModal() {
  const PUBLIC_PAGES = [
    'index.html',
    '',
    '/',
    'courses.html',
    'courses',
    '3-day-demo-class.html',
    '3-day-demo-class',
    'free-masterclass.html',
    'masterclass',
    'event.html',
    'event',
    'event-thank-you.html',
    'event-thank-you',
    'thank-you.html',
    'thank-you'
  ];

  const SECRET_KEY = 'Paras@123';
  const AUTH_STORAGE_KEY = 'ldi_admin_unlocked';

  function isUnlocked() {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === SECRET_KEY || sessionStorage.getItem(AUTH_STORAGE_KEY) === SECRET_KEY;
    } catch(e) {
      return false;
    }
  }

  function isPublicPage(url) {
    if (!url) return true;
    const cleanUrl = url.split('#')[0].split('?')[0].split('/').pop() || 'index.html';
    return PUBLIC_PAGES.includes(cleanUrl);
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const isCurrentPageProtected = !isPublicPage(currentPath);

  function ensureModalExists() {
    if (document.getElementById('siteMaintenanceModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'siteMaintenanceModal';
    overlay.className = 'maintenance-modal-overlay';
    overlay.innerHTML = `
      <div class="maintenance-modal-card">
        <button type="button" class="modal-close" id="siteMaintenanceCloseBtn" aria-label="Close">&times;</button>
        
        <div class="maintenance-badge">System Update in Progress</div>
        
        <h3 class="maintenance-title">This Page is<br><span>Under Maintenance</span></h3>
        <p class="maintenance-sub">We're making improvements. Back very shortly!</p>
        
        <div class="maintenance-info-box">
          <div class="maintenance-info-title">🎁 Meanwhile, attend a Free Demo Class</div>
          <div class="maintenance-info-desc">Attend live class sessions before making any decision. Zero fee, 100% practical experience.</div>
        </div>

        <a href="3-day-demo-class" class="maintenance-btn-cta" id="siteMaintenanceDemoBtn">
          🎁 3-Day Free Demo &rarr;
        </a>

        <div class="maintenance-auth-wrap">
          <button type="button" class="maintenance-auth-toggle" id="maintenanceAuthToggle">
            🔒 Preview Access (Staff Login)
          </button>
          <form class="maintenance-auth-form" id="maintenanceAuthForm">
            <input type="password" placeholder="Enter password" class="maintenance-pwd-input" id="maintenancePwdInput" required autocomplete="current-password">
            <button type="submit" class="maintenance-pwd-btn">Unlock</button>
          </form>
          <div class="maintenance-auth-error" id="maintenanceAuthError">Incorrect password. Try again.</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleClose();
    });

    const closeBtn = overlay.querySelector('#siteMaintenanceCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose);
    }

    const authToggle = overlay.querySelector('#maintenanceAuthToggle');
    const authForm = overlay.querySelector('#maintenanceAuthForm');
    const pwdInput = overlay.querySelector('#maintenancePwdInput');
    const authError = overlay.querySelector('#maintenanceAuthError');

    if (authToggle && authForm) {
      authToggle.addEventListener('click', () => {
        authForm.classList.toggle('open');
        if (authForm.classList.contains('open') && pwdInput) {
          pwdInput.focus();
        }
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = pwdInput ? pwdInput.value.trim() : '';
        if (pwd === SECRET_KEY) {
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, SECRET_KEY);
            sessionStorage.setItem(AUTH_STORAGE_KEY, SECRET_KEY);
          } catch(err) {}
          closeMaintenanceModal();
          if (authError) authError.style.display = 'none';
        } else {
          if (authError) authError.style.display = 'block';
          if (pwdInput) {
            pwdInput.value = '';
            pwdInput.focus();
          }
        }
      });
    }
  }

  function handleClose() {
    if (isCurrentPageProtected && !isUnlocked()) {
      window.location.href = '/';
    } else {
      closeMaintenanceModal();
    }
  }

  function openMaintenanceModal() {
    if (isUnlocked()) return;
    ensureModalExists();
    const modal = document.getElementById('siteMaintenanceModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMaintenanceModal() {
    const modal = document.getElementById('siteMaintenanceModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  window.openMaintenanceModal = openMaintenanceModal;
  window.closeMaintenanceModal = closeMaintenanceModal;

  // Intercept any clicks to protected pages if not unlocked
  document.addEventListener('click', (e) => {
    if (isUnlocked()) return;

    const trigger = e.target.closest('a, button, .open-maintenance-modal, [data-maintenance]');
    if (!trigger) return;

    if (trigger.classList.contains('open-maintenance-modal') || trigger.hasAttribute('data-maintenance')) {
      e.preventDefault();
      openMaintenanceModal();
      return;
    }

    if (trigger.tagName === 'A') {
      const href = trigger.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('tel:') && !href.startsWith('mailto:') && !href.startsWith('#')) {
        if (!isPublicPage(href)) {
          e.preventDefault();
          openMaintenanceModal();
        }
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  });

  // If directly visiting a protected page and not unlocked, show modal immediately
  if (isCurrentPageProtected && !isUnlocked()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', openMaintenanceModal);
    } else {
      openMaintenanceModal();
    }
  }
})();




