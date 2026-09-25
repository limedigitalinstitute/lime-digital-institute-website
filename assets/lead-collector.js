/**
 * Lime Digital Institute — Supabase Lead Collector & Attribution Engine
 * Captures all website lead submissions, UTM tracking parameters, IP/Geo info,
 * and button CTA context directly into Supabase.
 */

(function() {
  'use strict';

  // 1. Configuration
  window.LIME_SUPABASE_CONFIG = window.LIME_SUPABASE_CONFIG || {
    url: window.LIME_SUPABASE_URL || 'https://fkcdrkhpuuipazicibqz.supabase.co',
    anonKey: window.LIME_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY2Rya2hwdXVpcGF6aWNpYnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDYzODEsImV4cCI6MjEwNDUyMjM4MX0.niU0WNlA5FWkfhKFEbKG9Dafvc6hnwrSIGaHEkuOcJ8',
    table: 'leads'
  };

  // 2. UTM & Referral Tracker (Persists across page navigation via sessionStorage)
  function initUTMTracking() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_form', 'gclid', 'fbclid'];
      
      utmKeys.forEach(key => {
        const val = urlParams.get(key);
        if (val) {
          sessionStorage.setItem('lime_' + key, val);
        }
      });

      if (document.referrer && !sessionStorage.getItem('lime_initial_referrer')) {
        sessionStorage.setItem('lime_initial_referrer', document.referrer);
      }
      if (!sessionStorage.getItem('lime_landing_page')) {
        sessionStorage.setItem('lime_landing_page', window.location.href);
      }
    } catch (e) {
      console.warn('[Lime Analytics] UTM tracking init error:', e);
    }
  }

  function getStoredUTMs() {
    return {
      utm_source: sessionStorage.getItem('lime_utm_source') || '',
      utm_medium: sessionStorage.getItem('lime_utm_medium') || '',
      utm_campaign: sessionStorage.getItem('lime_utm_campaign') || '',
      utm_term: sessionStorage.getItem('lime_utm_term') || '',
      utm_content: sessionStorage.getItem('lime_utm_content') || '',
      utm_form: sessionStorage.getItem('lime_utm_form') || '',
      gclid: sessionStorage.getItem('lime_gclid') || '',
      fbclid: sessionStorage.getItem('lime_fbclid') || '',
      initial_referrer: sessionStorage.getItem('lime_initial_referrer') || document.referrer || '',
      landing_page: sessionStorage.getItem('lime_landing_page') || window.location.href
    };
  }

  // 3. Client Geo & IP Intelligence (Cached in sessionStorage)
  let geoDataPromise = null;
  function fetchClientGeo() {
    if (geoDataPromise) return geoDataPromise;

    const cachedGeo = sessionStorage.getItem('lime_geo_cache');
    if (cachedGeo) {
      try {
        geoDataPromise = Promise.resolve(JSON.parse(cachedGeo));
        return geoDataPromise;
      } catch (e) {}
    }

    geoDataPromise = fetch('https://ipapi.co/json/', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const geo = {
          ip: data.ip || '',
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || data.country || ''
        };
        sessionStorage.setItem('lime_geo_cache', JSON.stringify(geo));
        return geo;
      })
      .catch(() => {
        // Fallback if adblocker blocks ipapi.co
        return { ip: '', city: '', region: '', country: '' };
      });

    return geoDataPromise;
  }

  // 4. Device Type Helper
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
      return 'Mobile';
    }
    return 'Desktop';
  }

  // 5. Main Lead Submission Engine
  async function submitLeadToSupabase(leadPayload) {
    // 1. Immediately & synchronously forward lead to Zoho Forms in background (No delay for geo lookup)
    try {
      submitLeadToZoho(leadPayload);
    } catch (ze) {
      console.warn('[Lime Leads] Background Zoho forward call error:', ze);
    }

    const config = window.LIME_SUPABASE_CONFIG;
    const utms = getStoredUTMs();
    let geo = { ip: '', city: '', region: '', country: '' };

    try {
      geo = await fetchClientGeo();
    } catch (e) {}

    // Prepare full unified record
    const record = {
      name: (leadPayload.name || '').trim(),
      phone: ((leadPayload.country_code && !leadPayload.phone?.trim().startsWith('+')) ? (leadPayload.country_code.trim() + ' ') : '') + (leadPayload.phone || '').trim(),
      country_code: (leadPayload.country_code || '').trim(),
      email: (leadPayload.email || '').trim(),

      form_name: leadPayload.form_name || 'Website Form',
      cta_text: leadPayload.cta_text || 'Submit',
      button_id: leadPayload.button_id || '',

      page_url: window.location.href,
      page_title: document.title,
      referrer: utms.initial_referrer,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_term: utms.utm_term,
      utm_content: utms.utm_content,
      utm_form: leadPayload.utm_form || utms.utm_form || leadPayload.form_name || '',

      ip_address: geo.ip || '',
      city: geo.city || '',
      region: geo.region || '',
      country: geo.country || '',
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),

      raw_payload: {
        ...leadPayload,
        landing_page: utms.landing_page,
        gclid: utms.gclid,
        fbclid: utms.fbclid,
        timestamp: new Date().toISOString()
      }
    };

    // If Supabase credentials are placeholders, log to console for debugging
    if (!config.url || config.url.includes('YOUR_PROJECT_ID') || !config.anonKey || config.anonKey.includes('YOUR_SUPABASE')) {
      console.info('[Lime Leads] Supabase credentials not set yet. Captured record preview:', record);
      return { success: true, mocked: true, data: record };
    }

    // Send to Supabase REST API
    try {
      const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/${config.table}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Lime Leads] Supabase API submission error:', response.status, errorText);
        return { success: false, error: errorText };
      }

      console.log('[Lime Leads] Lead successfully recorded in Supabase:', record.email || record.phone);
      return { success: true, data: record };
    } catch (err) {
      console.error('[Lime Leads] Network error recording lead in Supabase:', err);
      return { success: false, error: err.message };
    }
  }

  // 6. Background Zoho Form Submission Engine for Demo Class & Inquiries
  function submitLeadToZoho(leadPayload) {
    try {
      const utms = getStoredUTMs();

      // Parse First and Last Name
      let rawName = (leadPayload.name || leadPayload.first_name || '').trim();
      let firstName = (leadPayload.first_name || '').trim();
      let lastName = (leadPayload.last_name || '').trim();

      if (!firstName) {
        const parts = rawName.split(/\s+/);
        firstName = parts[0] || 'Applicant';
        lastName = parts.slice(1).join(' ') || '.';
      }
      if (!lastName) lastName = '.';

      // Parse Phone & Country Code
      let countryCode = (leadPayload.country_code || leadPayload.countryCode || '').trim();
      let rawPhone = (leadPayload.phone || '').trim().replace(/[^0-9+]/g, '');

      // Clean and normalize countryCode to strictly match /^[+][0-9]{1,4}$/ required by Zoho Form
      let cleanCodeDigits = countryCode.replace(/[^0-9]/g, '');
      if (cleanCodeDigits) {
        countryCode = '+' + cleanCodeDigits;
      } else {
        // Fallback check if user entered international prefix directly in phone input
        if (rawPhone.startsWith('+')) {
          if (rawPhone.startsWith('+91') && rawPhone.length > 12) cleanCodeDigits = '91';
          else if (rawPhone.startsWith('+1') && rawPhone.length > 11) cleanCodeDigits = '1';
          else if (rawPhone.startsWith('+971') && rawPhone.length > 12) cleanCodeDigits = '971';
          else if (rawPhone.startsWith('+44') && rawPhone.length > 12) cleanCodeDigits = '44';
          else if (rawPhone.startsWith('+81') && rawPhone.length > 11) cleanCodeDigits = '81';
        }
        countryCode = cleanCodeDigits ? ('+' + cleanCodeDigits) : '+91';
        cleanCodeDigits = cleanCodeDigits || '91';
      }

      // Strip country code prefix or leading zero from phone digits if present
      let phoneNum = rawPhone.replace(/[^0-9]/g, '');
      if (phoneNum.startsWith(cleanCodeDigits) && phoneNum.length > cleanCodeDigits.length + 5) {
        phoneNum = phoneNum.slice(cleanCodeDigits.length);
      } else if (phoneNum.startsWith('0') && phoneNum.length > 9) {
        phoneNum = phoneNum.slice(1);
      }

      // Zoho's PhoneNumber field validates digits only and rejects a leading '+'
      // ("Enter only numbers"), so the phone value sent to Zoho must be digit-only,
      // even though the country code is still tracked separately with '+' below.
      const fullInternationalPhone = (countryCode + phoneNum).replace(/[^0-9]/g, '');

      // Helper to read cookie if sessionStorage didn't have it
      function getCookie(cname) {
        try {
          const name = cname + '=';
          const ca = document.cookie.split(';');
          for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) === 0) return decodeURIComponent(c.substring(name.length, c.length));
          }
        } catch (e) {}
        return '';
      }

      const zohoUrl = 'https://forms.zohopublic.in/LimeDigital/form/BookYourFreeDemoClass/formperma/OzywZykQLlNWtM6bcx7MkfJJcdHhqddFTv-HwasQraE/htmlRecords/submit';

      const utmForm = (leadPayload.utm_form || utms.utm_form || getCookie('utm_form') || leadPayload.form_name || 'Website Form').trim();

      const zohoData = {
        'SingleLine': firstName,
        'SingleLine1': lastName,
        'Email': (leadPayload.email || '').trim(),
        'PhoneNumber': fullInternationalPhone,
        'PhoneNumber_countrycode': fullInternationalPhone,
        'PhoneNumber_countrycodeval': countryCode,
        'PhoneNumber_countrycodeVal': countryCode,
        'zf_referrer_name': (document.URL || window.location.href || '').slice(0, 1500),
        'zf_redirect_url': '',
        'zc_gad': utms.gclid || getCookie('gclid') || '',
        'utm_source': utms.utm_source || getCookie('utm_source') || '',
        'utm_medium': utms.utm_medium || getCookie('utm_medium') || '',
        'utm_campaign': utms.utm_campaign || getCookie('utm_campaign') || '',
        'utm_term': utms.utm_term || getCookie('utm_term') || '',
        'utm_content': utms.utm_content || getCookie('utm_content') || '',
        'utm_form': utmForm
      };

      // Append tracking parameters to URL query string for maximum compatibility
      const qParams = new URLSearchParams();
      if (utmForm) qParams.set('utm_form', utmForm);
      if (zohoData.utm_source) qParams.set('utm_source', zohoData.utm_source);
      if (zohoData.utm_medium) qParams.set('utm_medium', zohoData.utm_medium);
      if (zohoData.utm_campaign) qParams.set('utm_campaign', zohoData.utm_campaign);
      if (zohoData.utm_term) qParams.set('utm_term', zohoData.utm_term);
      if (zohoData.utm_content) qParams.set('utm_content', zohoData.utm_content);
      if (zohoData.zc_gad) qParams.set('zc_gad', zohoData.zc_gad);

      const finalZohoUrl = zohoUrl + '?' + qParams.toString();

      // 1. Direct Background POST via fetch (mode: no-cors, keepalive: true)
      try {
        const fd = new FormData();
        for (const [key, value] of Object.entries(zohoData)) {
          fd.append(key, value || '');
        }
        fetch(finalZohoUrl, {
          method: 'POST',
          body: fd,
          mode: 'no-cors',
          keepalive: true
        }).catch(function() {});
      } catch (fe) {
        console.warn('[Lime Leads] Direct fetch to Zoho caught:', fe);
      }

      // 2. Browser-Safe Invisible Target Iframe Submission (with rendered layout dimensions)
      let iframe = document.getElementById('zoho_background_iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'zoho_background_iframe';
        iframe.name = 'zoho_background_iframe';
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;border:none;z-index:-9999;';
        iframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(iframe);
      }

      // Dynamic form targeted to iframe
      const form = document.createElement('form');
      form.method = 'POST';
      form.name = 'form';
      form.id = 'form_' + Date.now();
      form.action = finalZohoUrl;
      form.target = 'zoho_background_iframe';
      form.enctype = 'multipart/form-data';
      form.acceptCharset = 'UTF-8';
      form.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;border:none;';

      for (const [key, value] of Object.entries(zohoData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value || '';
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        try { form.remove(); } catch(e) {}
      }, 3000);

      console.log('[Lime Leads] Demo class lead successfully dispatched to Zoho in background:', firstName, fullInternationalPhone);
      return true;
    } catch (err) {
      console.warn('[Lime Leads] Background Zoho submission error:', err);
      return false;
    }
  }

  // Initialize tracking immediately
  initUTMTracking();
  fetchClientGeo(); // Pre-fetch in background

  // Expose global methods
  window.LimeLeadCollector = {
    submitLead: submitLeadToSupabase,
    submitToZoho: submitLeadToZoho,
    getUTMs: getStoredUTMs,
    getGeo: fetchClientGeo,
    getDevice: getDeviceType
  };

})();

