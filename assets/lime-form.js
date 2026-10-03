/* Lime Digital Institute — custom 3-step lead form.
 * Our own HTML/CSS (full design control), submitted in the background to the
 * real Zoho forms via a hidden iframe POST. Field names/values mirror the Zoho
 * exports in Forms/Learn_Digital_Marketing and Forms/Download_Brochure_PDF.
 * Usage: LimeForm.mount(containerId, { type: 'demo' | 'brochure', formName }) */
(function () {
  'use strict';

  const TARGETS = {
    demo: {
      action: 'https://forms.zohopublic.in/LimeDigital/form/MetaAdsForm/formperma/oTSSTfG3vvVyKolzsHdsx6xIamRyGQrb0LN7Vu57pzw/htmlRecords/submit',
      levelRequired: true,
      submitText: 'Claim Free Trial Pass →',
      thankYouType: 'trial',
      gtmType: 'Demo'
    },
    brochure: {
      action: 'https://forms.zohopublic.in/LimeDigital/form/DownloadBrochurePDF/formperma/rJG-pHVYGwwocTq4-0_Q4bdh2CebdiXjBHF-VTd5olY/htmlRecords/submit',
      levelRequired: false,
      submitText: 'Get Brochure on WhatsApp →',
      thankYouType: 'brochure',
      gtmType: 'Brochure'
    }
  };

  const INTEREST = ['Yes', 'No', 'Not sure — help me decide'];
  const LEVELS = [
    'Complete beginner — never done marketing',
    'Basic knowledge — done some social media',
    'Intermediate — run ads or managed pages',
    'Business owner — want to market my own brand'
  ];
  const START = ['Immediately — next available batch', 'Within 2 weeks', 'Next month', 'Just exploring for now'];
  const COUNTRY_CODES = [
    ['+91', '🇮🇳'], ['+1', '🇺🇸'], ['+44', '🇬🇧'], ['+971', '🇦🇪'], ['+61', '🇦🇺'], ['+65', '🇸🇬'],
    ['+966', '🇸🇦'], ['+974', '🇶🇦'], ['+968', '🇴🇲'], ['+965', '🇰🇼'], ['+973', '🇧🇭'], ['+49', '🇩🇪'],
    ['+33', '🇫🇷'], ['+64', '🇳🇿'], ['+60', '🇲🇾'], ['+27', '🇿🇦'], ['+81', '🇯🇵'], ['+977', '🇳🇵'],
    ['+880', '🇧🇩'], ['+94', '🇱🇰']
  ];
  const STEP_TITLES = ['Choose your path', 'Tell us more', 'Almost done'];

  // ── UTM / gclid capture, persisted for the session ──
  (function captureParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'].forEach((k) => {
        const v = params.get(k);
        if (v) sessionStorage.setItem('lime_' + k, v);
      });
    } catch (e) {}
  })();
  function stored(k) {
    try { return sessionStorage.getItem('lime_' + k) || ''; } catch (e) { return ''; }
  }
  function utms() {
    return {
      utm_source: stored('utm_source'),
      utm_medium: stored('utm_medium'),
      utm_campaign: stored('utm_campaign'),
      utm_term: stored('utm_term'),
      utm_content: stored('utm_content')
    };
  }
  function pushGTM(event, cfg, formName) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event, form_type: cfg.gtmType, form_name: formName, page_path: window.location.pathname }, utms()));
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // ── Styles (injected once; works on pages that don't load style.css) ──
  function injectStyles() {
    if (document.getElementById('lime-form-styles')) return;
    const css = `
.lf{--lf-red:#ED3237;--lf-red-soft:#fff5f5;--lf-ink:#111827;--lf-muted:#64748b;--lf-line:#e2e4e8;font-family:inherit;color:var(--lf-ink);width:100%;text-align:left}
.lf *{box-sizing:border-box}
.lf-progress{height:5px;background:#f1f2f4;border-radius:99px;overflow:hidden;margin:2px 0 14px}
.lf-progress span{display:block;height:100%;background:var(--lf-red);border-radius:99px;transition:width .35s ease}
.lf-steplabel{font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--lf-muted);margin-bottom:12px}
.lf-steplabel b{color:var(--lf-red)}
.lf-step{display:none;animation:lf-in .3s ease}
.lf-step.is-active{display:block}
@keyframes lf-in{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:none}}
.lf-q{font-size:14px;font-weight:600;margin:0 0 8px;line-height:1.35}
.lf-q .lf-opt{font-weight:500;color:var(--lf-muted);font-size:12px}
.lf-group{margin-bottom:16px}
.lf-pills{display:grid;gap:8px}
.lf-pills.cols-3{grid-template-columns:repeat(3,1fr)}
.lf-pills.cols-2{grid-template-columns:repeat(2,1fr)}
.lf-pill{position:relative;display:flex;align-items:center;gap:8px;min-height:44px;padding:9px 12px;border:1.5px solid var(--lf-line);border-radius:12px;background:#fff;cursor:pointer;font-size:12.5px;font-weight:500;line-height:1.3;transition:border-color .15s,background .15s,box-shadow .15s}
.lf-pill:hover{border-color:#cbd0d6}
.lf-pill input{position:absolute;opacity:0;pointer-events:none}
.lf-pill .lf-dot{flex:none;width:16px;height:16px;border-radius:50%;border:1.5px solid #c4c9d0;display:inline-flex;align-items:center;justify-content:center;transition:all .15s}
.lf-pill input:checked ~ .lf-dot{border-color:var(--lf-red);background:var(--lf-red);box-shadow:inset 0 0 0 3px #fff}
.lf-pill:has(input:checked){border-color:var(--lf-red);background:var(--lf-red-soft)}
.lf-pill input:focus-visible ~ .lf-dot{outline:2px solid var(--lf-red);outline-offset:2px}
.lf-input{width:100%;height:46px;padding:0 14px;border:1.5px solid var(--lf-line);border-radius:12px;font:inherit;font-size:14px;color:var(--lf-ink);background:#fff;outline:none;transition:border-color .15s,box-shadow .15s}
.lf-input:focus{border-color:var(--lf-red);box-shadow:0 0 0 3px rgba(237,50,55,.12)}
.lf-phone{display:flex;align-items:stretch;height:46px;border:1.5px solid var(--lf-line);border-radius:12px;overflow:hidden;background:#fff;transition:border-color .15s,box-shadow .15s}
.lf-phone:focus-within{border-color:var(--lf-red);box-shadow:0 0 0 3px rgba(237,50,55,.12)}
.lf-phone select{border:none;border-right:1.5px solid var(--lf-line);background:#f8fafc;padding:0 8px;font:inherit;font-size:13px;font-weight:600;outline:none;cursor:pointer}
.lf-phone input{flex:1;min-width:0;border:none;outline:none;padding:0 12px;font:inherit;font-size:14px;background:transparent}
.lf-hint{font-size:11px;color:var(--lf-muted);margin-top:5px}
.lf-consent{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.4;color:var(--lf-muted);margin:4px 0 14px;cursor:pointer}
.lf-consent input{margin-top:2px;accent-color:var(--lf-red);flex:none}
.lf-error{display:none;font-size:12px;font-weight:500;color:var(--lf-red);margin:-4px 0 12px}
.lf-error.is-on{display:block}
.lf-actions{display:flex;gap:10px;align-items:center}
.lf-btn{flex:1;height:50px;border:none;border-radius:999px;background:var(--lf-red);color:#fff;font:inherit;font-size:14px;font-weight:700;letter-spacing:.2px;cursor:pointer;box-shadow:0 6px 18px rgba(237,50,55,.32);transition:background .15s,transform .1s,opacity .15s}
.lf-btn:hover{background:#cc252a}
.lf-btn:active{transform:scale(.98)}
.lf-btn[disabled]{opacity:.65;cursor:wait}
.lf-back{flex:none;height:50px;padding:0 16px;border:1.5px solid var(--lf-line);border-radius:999px;background:#fff;color:var(--lf-ink);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.lf-back:hover{border-color:#cbd0d6}
.lf-trust{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--lf-muted);margin-top:12px}
.lf-trust span::before{content:"✓ ";color:var(--lf-red);font-weight:700}
.lf-done{display:none;text-align:center;padding:24px 8px}
.lf-done.is-on{display:block}
.lf-done-icon{width:56px;height:56px;margin:0 auto 12px;border-radius:50%;background:var(--lf-red-soft);color:var(--lf-red);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800}
.lf-done h4{font-size:17px;font-weight:800;margin:0 0 4px}
.lf-done p{font-size:13px;color:var(--lf-muted);margin:0}
@media (max-width:420px){.lf-pills.cols-2,.lf-pills.cols-3{grid-template-columns:1fr}}
`;
    const style = document.createElement('style');
    style.id = 'lime-form-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function pills(name, options, cols) {
    return `<div class="lf-pills cols-${cols}">` + options.map((o) =>
      `<label class="lf-pill"><input type="radio" name="${name}" value="${esc(o)}"><span class="lf-dot"></span><span>${esc(o)}</span></label>`
    ).join('') + '</div>';
  }

  function render(uid, cfg) {
    const n = (k) => `lf_${uid}_${k}`;
    return `
<form class="lf" novalidate>
  <div class="lf-progress"><span style="width:33.33%"></span></div>
  <div class="lf-steplabel">Step <b class="lf-stepnum">1</b> of 3 — <span class="lf-steptitle">${STEP_TITLES[0]}</span></div>

  <div class="lf-step is-active" data-step="1">
    <div class="lf-group"><p class="lf-q">Are you interested in learning Digital Marketing?</p>${pills(n('interest'), INTEREST, 3)}</div>
    <div class="lf-group"><p class="lf-q">What's your current level?${cfg.levelRequired ? '' : ' <span class="lf-opt">(optional)</span>'}</p>${pills(n('level'), LEVELS, 2)}</div>
  </div>

  <div class="lf-step" data-step="2">
    <div class="lf-group"><p class="lf-q">When do you want to start?</p>${pills(n('start'), START, 2)}</div>
    <div class="lf-group"><p class="lf-q">What's your main goal? <span class="lf-opt">(optional)</span></p>
      <input class="lf-input" name="goal" maxlength="255" placeholder="e.g. Get a job, grow my business, freelance…"></div>
  </div>

  <div class="lf-step" data-step="3">
    <div class="lf-group"><p class="lf-q">Full name</p>
      <input class="lf-input" name="name" maxlength="255" autocomplete="name" placeholder="e.g. Rahul Patel"></div>
    <div class="lf-group"><p class="lf-q">WhatsApp number</p>
      <div class="lf-phone lid-phone-group">
        <select name="country_code" aria-label="Country code">${COUNTRY_CODES.map(([c, f]) => `<option value="${c}"${c === '+91' ? ' selected' : ''}>${f} ${c}</option>`).join('')}</select>
        <input type="tel" name="phone" inputmode="numeric" autocomplete="tel-national" maxlength="10" pattern="[0-9]{10}" placeholder="10-digit mobile number">
      </div>
      <div class="lf-hint">We'll send ${cfg.thankYouType === 'brochure' ? 'the brochure' : 'your trial pass'} on WhatsApp.</div></div>
    <label class="lf-consent"><input type="checkbox" name="consent" checked><span>I agree to be contacted by Lime Digital Institute on WhatsApp &amp; call. This overrides DNC/NDNC.</span></label>
  </div>

  <div class="lf-error" role="alert"></div>
  <div class="lf-actions">
    <button type="button" class="lf-back" hidden>← Back</button>
    <button type="submit" class="lf-btn">Continue →</button>
  </div>
  <div class="lf-trust"><span>100% data privacy</span><span>8,000+ students trained</span></div>
</form>
<div class="lf-done"><div class="lf-done-icon">✓</div><h4>You're in!</h4><p>Check WhatsApp — we'll reach out shortly.</p></div>`;
  }

  function submitToZoho(cfg, formName, data) {
    return new Promise((resolve) => {
      const u = utms();
      const fields = Object.assign({
        zf_referrer_name: (window.location.href || '').slice(0, 1500),
        zf_redirect_url: '',
        zc_gad: stored('gclid'),
        Dropdown: data.interest,
        Dropdown1: data.level || '-Select-',
        Dropdown2: data.start,
        SingleLine: data.goal,
        PhoneNumber_countrycodeval: data.code,
        PhoneNumber_countrycode: data.phone
      }, u);
      if (cfg === TARGETS.brochure) {
        fields.SingleLine1 = data.name;
        fields.form_name = formName;
      } else {
        const parts = data.name.split(/\s+/);
        fields.Name_First = parts[0];
        fields.Name_Last = parts.slice(1).join(' ') || '.';
      }

      const frameName = 'lf_zoho_' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = frameName;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:0;opacity:0';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = cfg.action;
      form.target = frameName;
      form.enctype = 'multipart/form-data';
      form.acceptCharset = 'UTF-8';
      form.style.display = 'none';
      Object.entries(fields).forEach(([k, v]) => {
        const i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = v || '';
        form.appendChild(i);
      });
      document.body.appendChild(form);

      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      // Cross-origin response can't be read; its load event means Zoho answered.
      setTimeout(() => {
        iframe.addEventListener('load', finish);
        form.submit();
      }, 0);
      setTimeout(finish, 4000);
    });
  }

  function wire(root, cfg) {
    const form = root.querySelector('.lf');
    const steps = form.querySelectorAll('.lf-step');
    const bar = form.querySelector('.lf-progress span');
    const stepNum = form.querySelector('.lf-stepnum');
    const stepTitle = form.querySelector('.lf-steptitle');
    const err = form.querySelector('.lf-error');
    const back = form.querySelector('.lf-back');
    const next = form.querySelector('.lf-btn');
    let step = 1;
    const f = (n) => form.querySelector('[name="' + n + '"]');

    const val = (name) => (form.querySelector(`input[name$="_${name}"]:checked`) || {}).value || '';
    const showErr = (msg) => { err.textContent = msg; err.classList.toggle('is-on', !!msg); };

    function go(to) {
      step = to;
      steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === step));
      bar.style.width = (step / 3 * 100) + '%';
      stepNum.textContent = step;
      stepTitle.textContent = STEP_TITLES[step - 1];
      back.hidden = step === 1;
      next.textContent = step === 3 ? cfg.submitText : 'Continue →';
      showErr('');
    }

    function validate() {
      if (step === 1) {
        if (!val('interest')) return 'Please choose whether you want to learn digital marketing.';
        if (cfg.levelRequired && !val('level')) return 'Please pick your current level.';
      }
      if (step === 2 && !val('start')) return 'Please tell us when you want to start.';
      if (step === 3) {
        const name = f('name').value.trim();
        const code = f('country_code').value;
        const phone = f('phone').value.replace(/\D/g, '');
        if (name.length < 2) return 'Please enter your full name.';
        if (code === '+91' ? phone.length !== 10 : (phone.length < 7 || phone.length > 15)) {
          return code === '+91' ? 'Please enter a valid 10-digit mobile number.' : 'Please enter a valid WhatsApp number.';
        }
        if (!f('consent').checked) return 'Please accept the consent to continue.';
      }
      return '';
    }

    // Auto-advance-free: selecting a pill just clears any error.
    form.addEventListener('change', () => showErr(''));
    f('phone').addEventListener('input', () => { f('phone').value = f('phone').value.replace(/\D/g, ''); });
    back.addEventListener('click', () => go(step - 1));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = validate();
      if (msg) { showErr(msg); return; }
      if (step < 3) { go(step + 1); return; }

      next.disabled = true;
      next.textContent = 'Submitting…';
      const formName = root.dataset.formName || '';
      const data = {
        interest: val('interest'),
        level: val('level'),
        start: val('start'),
        goal: f('goal').value.trim(),
        name: f('name').value.trim(),
        code: f('country_code').value,
        phone: f('phone').value.replace(/\D/g, '')
      };
      await submitToZoho(cfg, formName, data);
      pushGTM('zoho_form_submit', cfg, formName);

      form.style.display = 'none';
      root.querySelector('.lf-done').classList.add('is-on');
      setTimeout(() => {
        window.location.href = 'thank-you?type=' + cfg.thankYouType + '&name=' + encodeURIComponent(data.name.split(/\s+/)[0]);
      }, 1200);
    });
  }

  let uidSeq = 0;
  function mount(containerId, opts) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const cfg = TARGETS[opts && opts.type] || TARGETS.demo;
    // Placement label can change on every open (which button opened the popup)
    root.dataset.formName = (opts && opts.formName) || '';
    pushGTM('zoho_form_open', cfg, root.dataset.formName);
    if (root.querySelector('.lf')) return;

    injectStyles();
    root.innerHTML = render(++uidSeq, cfg);
    wire(root, cfg);
    if (window.initCountryPickers) window.initCountryPickers();
  }

  window.LimeForm = { mount };
})();
