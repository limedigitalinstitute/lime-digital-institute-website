/**
 * Lime Digital Institute — Searchable Country Code Picker
 * Replaces native non-searchable select dropdowns with a modern searchable country code picker.
 * Matches Zoho Form's search experience ("Search country or code...", live filter on typing code or name).
 * Fully compatible with Zoho Form field constraints (/^[+][0-9]{1,4}$/) and Supabase.
 */

(function() {
  'use strict';

  const COUNTRIES = [
    { name: "India", code: "+91", flag: "🇮🇳", iso: "IN", priority: 1 },
    { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", iso: "AE", keywords: "UAE Dubai Abu Dhabi", priority: 2 },
    { name: "United States", code: "+1", flag: "🇺🇸", iso: "US", keywords: "USA America", priority: 3 },
    { name: "United Kingdom", code: "+44", flag: "🇬🇧", iso: "GB", keywords: "UK Britain England", priority: 4 },
    { name: "Canada", code: "+1", flag: "🇨🇦", iso: "CA", priority: 5 },
    { name: "Australia", code: "+61", flag: "🇦🇺", iso: "AU", priority: 6 },
    { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", iso: "SA", keywords: "KSA", priority: 7 },
    { name: "Qatar", code: "+974", flag: "🇶🇦", iso: "QA", priority: 8 },
    { name: "Oman", code: "+968", flag: "🇴🇲", iso: "OM", priority: 9 },
    { name: "Kuwait", code: "+965", flag: "🇰🇼", iso: "KW", priority: 10 },
    { name: "Bahrain", code: "+973", flag: "🇧🇭", iso: "BH", priority: 11 },
    { name: "Singapore", code: "+65", flag: "🇸🇬", iso: "SG", priority: 12 },
    { name: "Germany", code: "+49", flag: "🇩🇪", iso: "DE", keywords: "Deutschland", priority: 13 },
    { name: "Japan", code: "+81", flag: "🇯🇵", iso: "JP", keywords: "Nippon", priority: 14 },
    { name: "France", code: "+33", flag: "🇫🇷", iso: "FR", priority: 15 },
    { name: "New Zealand", code: "+64", flag: "🇳🇿", iso: "NZ", priority: 16 },
    { name: "Malaysia", code: "+60", flag: "🇲🇾", iso: "MY", priority: 17 },
    { name: "South Africa", code: "+27", flag: "🇿🇦", iso: "ZA", priority: 18 },
    { name: "Nepal", code: "+977", flag: "🇳🇵", iso: "NP", priority: 19 },
    { name: "Bangladesh", code: "+880", flag: "🇧🇩", iso: "BD", priority: 20 },
    { name: "Sri Lanka", code: "+94", flag: "🇱🇰", iso: "LK", priority: 21 },
    { name: "Afghanistan", code: "+93", flag: "🇦🇫", iso: "AF" },
    { name: "Albania", code: "+355", flag: "🇦🇱", iso: "AL" },
    { name: "Algeria", code: "+213", flag: "🇩🇿", iso: "DZ" },
    { name: "Andorra", code: "+376", flag: "🇦🇩", iso: "AD" },
    { name: "Angola", code: "+244", flag: "🇦🇴", iso: "AO" },
    { name: "Argentina", code: "+54", flag: "🇦🇷", iso: "AR" },
    { name: "Armenia", code: "+374", flag: "🇦🇲", iso: "AM" },
    { name: "Austria", code: "+43", flag: "🇦🇹", iso: "AT" },
    { name: "Azerbaijan", code: "+994", flag: "🇦🇿", iso: "AZ" },
    { name: "Bahamas", code: "+1", flag: "🇧🇸", iso: "BS" },
    { name: "Barbados", code: "+1", flag: "🇧🇧", iso: "BB" },
    { name: "Belarus", code: "+375", flag: "🇧🇾", iso: "BY" },
    { name: "Belgium", code: "+32", flag: "🇧🇪", iso: "BE" },
    { name: "Belize", code: "+501", flag: "🇧🇿", iso: "BZ" },
    { name: "Benin", code: "+229", flag: "🇧🇯", iso: "BJ" },
    { name: "Bhutan", code: "+975", flag: "🇧🇹", iso: "BT" },
    { name: "Bolivia", code: "+591", flag: "🇧🇴", iso: "BO" },
    { name: "Bosnia and Herzegovina", code: "+387", flag: "🇧🇦", iso: "BA" },
    { name: "Botswana", code: "+267", flag: "🇧🇼", iso: "BW" },
    { name: "Brazil", code: "+55", flag: "🇧🇷", iso: "BR" },
    { name: "Brunei", code: "+673", flag: "🇧🇳", iso: "BN" },
    { name: "Bulgaria", code: "+359", flag: "🇧🇬", iso: "BG" },
    { name: "Cambodia", code: "+855", flag: "🇰🇭", iso: "KH" },
    { name: "Cameroon", code: "+237", flag: "🇨🇲", iso: "CM" },
    { name: "Chile", code: "+56", flag: "🇨🇱", iso: "CL" },
    { name: "China", code: "+86", flag: "🇨🇳", iso: "CN" },
    { name: "Colombia", code: "+57", flag: "🇨🇴", iso: "CO" },
    { name: "Costa Rica", code: "+506", flag: "🇨🇷", iso: "CR" },
    { name: "Croatia", code: "+385", flag: "🇭🇷", iso: "HR" },
    { name: "Cyprus", code: "+357", flag: "🇨🇾", iso: "CY" },
    { name: "Czech Republic", code: "+420", flag: "🇨🇿", iso: "CZ" },
    { name: "Denmark", code: "+45", flag: "🇩🇰", iso: "DK" },
    { name: "Ecuador", code: "+593", flag: "🇪🇨", iso: "EC" },
    { name: "Egypt", code: "+20", flag: "🇪🇬", iso: "EG" },
    { name: "Estonia", code: "+372", flag: "🇪🇪", iso: "EE" },
    { name: "Ethiopia", code: "+251", flag: "🇪🇹", iso: "ET" },
    { name: "Fiji", code: "+679", flag: "🇫🇯", iso: "FJ" },
    { name: "Finland", code: "+358", flag: "🇫🇮", iso: "FI" },
    { name: "Georgia", code: "+995", flag: "🇬🇪", iso: "GE" },
    { name: "Ghana", code: "+233", flag: "🇬🇭", iso: "GH" },
    { name: "Greece", code: "+30", flag: "🇬🇷", iso: "GR" },
    { name: "Hong Kong", code: "+852", flag: "🇭🇰", iso: "HK" },
    { name: "Hungary", code: "+36", flag: "🇭🇺", iso: "HU" },
    { name: "Iceland", code: "+354", flag: "🇮🇸", iso: "IS" },
    { name: "Indonesia", code: "+62", flag: "🇮🇩", iso: "ID" },
    { name: "Iran", code: "+98", flag: "🇮🇷", iso: "IR" },
    { name: "Iraq", code: "+964", flag: "🇮🇶", iso: "IQ" },
    { name: "Ireland", code: "+353", flag: "🇮🇪", iso: "IE" },
    { name: "Israel", code: "+972", flag: "🇮🇱", iso: "IL" },
    { name: "Italy", code: "+39", flag: "🇮🇹", iso: "IT" },
    { name: "Jordan", code: "+962", flag: "🇯🇴", iso: "JO" },
    { name: "Kazakhstan", code: "+7", flag: "🇰🇿", iso: "KZ" },
    { name: "Kenya", code: "+254", flag: "🇰🇪", iso: "KE" },
    { name: "Kyrgyzstan", code: "+996", flag: "🇰🇬", iso: "KG" },
    { name: "Laos", code: "+856", flag: "🇱🇦", iso: "LA" },
    { name: "Latvia", code: "+371", flag: "🇱🇻", iso: "LV" },
    { name: "Lebanon", code: "+961", flag: "🇱🇧", iso: "LB" },
    { name: "Lithuania", code: "+370", flag: "🇱🇹", iso: "LT" },
    { name: "Luxembourg", code: "+352", flag: "🇱🇺", iso: "LU" },
    { name: "Macau", code: "+853", flag: "🇲🇴", iso: "MO" },
    { name: "Maldives", code: "+960", flag: "🇲🇻", iso: "MV" },
    { name: "Mauritius", code: "+230", flag: "🇲🇺", iso: "MU" },
    { name: "Mexico", code: "+52", flag: "🇲🇽", iso: "MX" },
    { name: "Moldova", code: "+373", flag: "🇲🇩", iso: "MD" },
    { name: "Monaco", code: "+377", flag: "🇲🇨", iso: "MC" },
    { name: "Mongolia", code: "+976", flag: "🇲🇳", iso: "MN" },
    { name: "Montenegro", code: "+382", flag: "🇲🇪", iso: "ME" },
    { name: "Morocco", code: "+212", flag: "🇲🇦", iso: "MA" },
    { name: "Myanmar", code: "+95", flag: "🇲🇲", iso: "MM" },
    { name: "Netherlands", code: "+31", flag: "🇳🇱", iso: "NL", keywords: "Holland" },
    { name: "Nigeria", code: "+234", flag: "🇳🇬", iso: "NG" },
    { name: "Norway", code: "+47", flag: "🇳🇴", iso: "NO" },
    { name: "Pakistan", code: "+92", flag: "🇵🇰", iso: "PK" },
    { name: "Panama", code: "+507", flag: "🇵🇦", iso: "PA" },
    { name: "Peru", code: "+51", flag: "🇵🇪", iso: "PE" },
    { name: "Philippines", code: "+63", flag: "🇵🇭", iso: "PH" },
    { name: "Poland", code: "+48", flag: "🇵🇱", iso: "PL" },
    { name: "Portugal", code: "+351", flag: "🇵🇹", iso: "PT" },
    { name: "Romania", code: "+40", flag: "🇷🇴", iso: "RO" },
    { name: "Russia", code: "+7", flag: "🇷🇺", iso: "RU" },
    { name: "Rwanda", code: "+250", flag: "🇷🇼", iso: "RW" },
    { name: "Senegal", code: "+221", flag: "🇸🇳", iso: "SN" },
    { name: "Serbia", code: "+381", flag: "🇷🇸", iso: "RS" },
    { name: "Seychelles", code: "+248", flag: "🇸🇨", iso: "SC" },
    { name: "Slovakia", code: "+421", flag: "🇸🇰", iso: "SK" },
    { name: "Slovenia", code: "+386", flag: "🇸🇮", iso: "SI" },
    { name: "South Korea", code: "+82", flag: "🇰🇷", iso: "KR", keywords: "Korea" },
    { name: "Spain", code: "+34", flag: "🇪🇸", iso: "ES" },
    { name: "Sudan", code: "+249", flag: "🇸🇩", iso: "SD" },
    { name: "Sweden", code: "+46", flag: "🇸🇪", iso: "SE" },
    { name: "Switzerland", code: "+41", flag: "🇨🇭", iso: "CH" },
    { name: "Taiwan", code: "+886", flag: "🇹🇼", iso: "TW" },
    { name: "Tajikistan", code: "+992", flag: "🇹🇯", iso: "TJ" },
    { name: "Tanzania", code: "+255", flag: "🇹🇿", iso: "TZ" },
    { name: "Thailand", code: "+66", flag: "🇹🇭", iso: "TH" },
    { name: "Tunisia", code: "+216", flag: "🇹🇳", iso: "TN" },
    { name: "Turkey", code: "+90", flag: "🇹🇷", iso: "TR", keywords: "Turkiye" },
    { name: "Uganda", code: "+256", flag: "🇺🇬", iso: "UG" },
    { name: "Ukraine", code: "+380", flag: "🇺🇦", iso: "UA" },
    { name: "Uruguay", code: "+598", flag: "🇺🇾", iso: "UY" },
    { name: "Uzbekistan", code: "+998", flag: "🇺🇿", iso: "UZ" },
    { name: "Venezuela", code: "+58", flag: "🇻🇪", iso: "VE" },
    { name: "Vietnam", code: "+84", flag: "🇻🇳", iso: "VN" },
    { name: "Yemen", code: "+967", flag: "🇾🇪", iso: "YE" },
    { name: "Zambia", code: "+260", flag: "🇿🇲", iso: "ZM" },
    { name: "Zimbabwe", code: "+263", flag: "🇿🇼", iso: "ZW" }
  ];

  // Helper to find country by code or iso
  function findCountry(val) {
    if (!val) return COUNTRIES[0];
    const clean = val.trim();
    return COUNTRIES.find(c => c.code === clean || c.iso === clean || c.name.toLowerCase() === clean.toLowerCase()) || COUNTRIES[0];
  }

  // India (+91) mobile numbers are always exactly 10 digits — every other
  // country keeps the generic 7-15 digit range.
  function findPhoneInput(select) {
    const group = select.closest('.lid-phone-group, .phone-row, .curr-phone-row, .form-group, .brochure-phone') || select.parentElement;
    return group ? group.querySelector('input[type="tel"], input[name="phone"]') : null;
  }
  function applyPhoneDigitLimit(select, phoneInput) {
    phoneInput = phoneInput || findPhoneInput(select);
    if (!phoneInput) return;
    if (select.value === '+91') {
      phoneInput.setAttribute('maxlength', '10');
      phoneInput.setAttribute('pattern', '[0-9]{10}');
      phoneInput.setAttribute('title', 'Enter a 10-digit mobile number');
      if (phoneInput.value.replace(/\D/g, '').length > 10) {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
      }
    } else {
      phoneInput.setAttribute('maxlength', '15');
      phoneInput.setAttribute('pattern', '[0-9]{7,15}');
      phoneInput.removeAttribute('title');
    }
  }

  // Ensure critical styles exist even if external stylesheet is cached
  function injectStyles() {
    if (document.getElementById('lime-cp-injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'lime-cp-injected-styles';
    style.textContent = `
      .lime-cp-trigger {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-direction: row !important;
        gap: 6px !important;
        background: #ffffff !important;
        border: 1.5px solid #E2E4E8 !important;
        border-radius: 9px !important;
        padding: 0 11px !important;
        font-family: inherit !important;
        font-size: 13.5px !important;
        font-weight: 500 !important;
        color: #1A1A1A !important;
        cursor: pointer !important;
        outline: none !important;
        user-select: none !important;
        white-space: nowrap !important;
        flex: none !important;
        flex-shrink: 0 !important;
        height: 42px !important;
        box-sizing: border-box !important;
        box-shadow: none !important;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.15s ease !important;
      }
      .lime-cp-trigger:hover {
        background: #ffffff !important;
        border-color: #cbd5e1 !important;
      }
      .lime-cp-trigger:focus-visible,
      .lime-cp-trigger[aria-expanded="true"] {
        border-color: #ED3237 !important;
        box-shadow: 0 0 0 3px rgba(237, 50, 55, 0.12) !important;
        background: #ffffff !important;
      }
      .brochure-phone .lime-cp-trigger {
        border: 1px solid #E5E5E5 !important;
        border-radius: 10px !important;
        background: #ffffff !important;
        padding: 0 10px !important;
        height: 42px !important;
        font-size: 13.5px !important;
        color: #1A1A1A !important;
        box-sizing: border-box !important;
      }
      .brochure-phone .lime-cp-trigger:hover {
        background: #ffffff !important;
        border-color: #cbd5e1 !important;
      }
      .brochure-phone .lime-cp-trigger:focus-visible,
      .brochure-phone .lime-cp-trigger[aria-expanded="true"] {
        border-color: #ED3237 !important;
        box-shadow: 0 0 0 3px rgba(237, 50, 55, 0.12) !important;
        background: #ffffff !important;
      }
      .curr-phone-row .lime-cp-trigger {
        border: 1.5px solid #E2E4E8 !important;
        border-radius: 9px !important;
        background: #ffffff !important;
        padding: 0 10px !important;
        height: 42px !important;
        font-size: 13.5px !important;
        color: #1A1A1A !important;
        box-sizing: border-box !important;
      }
      .curr-phone-row .lime-cp-trigger:hover {
        background: #ffffff !important;
        border-color: #cbd5e1 !important;
      }
      .curr-phone-row .lime-cp-trigger:focus-visible,
      .curr-phone-row .lime-cp-trigger[aria-expanded="true"] {
        border-color: #ED3237 !important;
        box-shadow: 0 0 0 3px rgba(237, 50, 55, 0.12) !important;
        background: #ffffff !important;
      }
      .lid-phone-group:not(.curr-phone-row) .lime-cp-trigger {
        background: #ffffff !important;
        border: none !important;
        border-right: 1.5px solid #d5d5d5 !important;
        border-radius: 0 !important;
        height: 100% !important;
      }
      .lime-cp-trigger .cp-flag {
        font-size: 17px !important;
        line-height: 1 !important;
        display: inline-flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
      }
      .lime-cp-trigger .cp-code {
        font-weight: 600 !important;
        font-size: 13px !important;
        color: #1e293b !important;
        letter-spacing: -0.2px !important;
        flex-shrink: 0 !important;
      }
      .lime-cp-trigger .cp-arrow {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: #64748b !important;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s !important;
        margin-left: 2px !important;
        flex-shrink: 0 !important;
      }
      .lime-cp-trigger[aria-expanded="true"] .cp-arrow {
        transform: rotate(180deg) !important;
        color: #ED3237 !important;
      }
      .lime-cp-dropdown {
        position: fixed !important;
        z-index: 999999 !important;
        width: 285px !important;
        max-width: calc(100vw - 24px) !important;
        background: #ffffff !important;
        border: 1.5px solid #E2E4E8 !important;
        border-radius: 12px !important;
        box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
        padding: 8px !important;
        font-family: 'Poppins', -apple-system, sans-serif !important;
        display: none !important;
        box-sizing: border-box !important;
        animation: limeCpFade 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .lime-cp-dropdown.cp-open {
        display: block !important;
      }
      @keyframes limeCpFade {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .lime-cp-search-wrap {
        position: relative !important;
        margin-bottom: 6px !important;
      }
      .lime-cp-search-icon {
        position: absolute !important;
        left: 10px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 15px !important;
        height: 15px !important;
        color: #94a3b8 !important;
        pointer-events: none !important;
      }
      .lime-cp-search-input {
        width: 100% !important;
        padding: 8px 10px 8px 32px !important;
        font-family: 'Poppins', -apple-system, sans-serif !important;
        font-size: 13px !important;
        color: #1e293b !important;
        background: #f8fafc !important;
        border: 1.5px solid #e2e8f0 !important;
        border-radius: 8px !important;
        outline: none !important;
        box-sizing: border-box !important;
        transition: border-color 0.15s, background 0.15s, box-shadow 0.15s !important;
      }
      .lime-cp-search-input:focus {
        border-color: #ED3237 !important;
        background: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(237, 50, 55, 0.12) !important;
      }
      .lime-cp-list-wrap {
        max-height: 240px !important;
        overflow-y: auto !important;
        overscroll-behavior: contain !important;
      }
      .lime-cp-list-wrap::-webkit-scrollbar {
        width: 5px !important;
      }
      .lime-cp-list-wrap::-webkit-scrollbar-thumb {
        background: #cbd5e1 !important;
        border-radius: 4px !important;
      }
      .lime-cp-list {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .lime-cp-item {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 8px 10px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        gap: 8px !important;
        transition: background 0.12s ease !important;
      }
      .lime-cp-item:hover, .lime-cp-item.cp-highlighted {
        background: #fff5f5 !important;
      }
      .lime-cp-item.cp-selected {
        background: #fee2e2 !important;
      }
      .lime-cp-country-left {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        overflow: hidden !important;
      }
      .lime-cp-item-flag {
        font-size: 17px !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      }
      .lime-cp-item-name {
        font-size: 13px !important;
        font-weight: 500 !important;
        color: #1e293b !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 175px !important;
      }
      .lime-cp-item-code {
        font-size: 12.5px !important;
        font-weight: 600 !important;
        color: #ED3237 !important;
        font-feature-settings: "tnum" !important;
        flex-shrink: 0 !important;
      }
      .lime-cp-empty {
        padding: 16px 10px !important;
        text-align: center !important;
        font-size: 12.5px !important;
        color: #94a3b8 !important;
        list-style: none !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    }
  }

  // Active dropdown singleton state
  let activeDropdown = null;
  let activeTrigger = null;
  let activeSelect = null;

  function createDropdownElement() {
    const el = document.createElement('div');
    el.className = 'lime-cp-dropdown';
    el.innerHTML = `
      <div class="lime-cp-search-wrap">
        <svg class="lime-cp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" class="lime-cp-search-input" placeholder="Search country or code..." autocomplete="off" spellcheck="false">
      </div>
      <div class="lime-cp-list-wrap">
        <ul class="lime-cp-list" role="listbox"></ul>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function renderList(dropdown, filterQuery = '', selectedCode = '+91') {
    const listEl = dropdown.querySelector('.lime-cp-list');
    const q = filterQuery.trim().toLowerCase();
    const cleanQ = q.replace(/^[+]/, '');

    const filtered = COUNTRIES.filter(c => {
      if (!q) return true;
      const nameMatch = c.name.toLowerCase().includes(q);
      const codeMatch = c.code.includes(q) || c.code.replace('+', '').includes(cleanQ);
      const isoMatch = c.iso && c.iso.toLowerCase().includes(q);
      const kwMatch = c.keywords && c.keywords.toLowerCase().includes(q);
      return nameMatch || codeMatch || isoMatch || kwMatch;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<li class="lime-cp-empty">No country or code found</li>';
      return;
    }

    listEl.innerHTML = filtered.map((c, index) => {
      const isSelected = c.code === selectedCode;
      return `
        <li class="lime-cp-item ${isSelected ? 'cp-selected' : ''} ${index === 0 && q ? 'cp-highlighted' : ''}" 
            data-code="${c.code}" 
            data-flag="${c.flag}" 
            data-name="${c.name}"
            role="option"
            aria-selected="${isSelected}">
          <div class="lime-cp-country-left">
            <span class="lime-cp-item-flag">${c.flag}</span>
            <span class="lime-cp-item-name">${c.name}</span>
          </div>
          <span class="lime-cp-item-code">${c.code}</span>
        </li>
      `;
    }).join('');

    // Scroll to selected if not searching
    if (!q) {
      const selectedEl = listEl.querySelector('.cp-selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function positionDropdown(dropdown, trigger) {
    const rect = trigger.getBoundingClientRect();
    const dropWidth = 280;
    const dropHeight = 285;
    const padding = 8;

    let left = rect.left;
    // Keep inside window horizontally
    if (left + dropWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - dropWidth - padding);
    }
    if (left < padding) left = padding;

    // Open downward by default, upward if space below is too small
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + 4;
    if (spaceBelow < dropHeight && spaceAbove > spaceBelow) {
      top = Math.max(padding, rect.top - dropHeight - 4);
    }

    dropdown.style.left = left + 'px';
    dropdown.style.top = top + 'px';
  }

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.classList.remove('cp-open');
    }
    if (activeTrigger) {
      activeTrigger.setAttribute('aria-expanded', 'false');
      const isBrochure = activeTrigger.classList.contains('lime-cp-brochure') || !!activeTrigger.closest('.brochure-phone');
      const isUnified = activeTrigger.classList.contains('lime-cp-unified') || !!activeTrigger.closest('.lid-phone-group:not(.curr-phone-row)');
      if (!isUnified) {
        activeTrigger.style.setProperty('border-color', isBrochure ? '#E5E5E5' : '#E2E4E8', 'important');
        activeTrigger.style.setProperty('box-shadow', 'none', 'important');
      }
    }
    activeDropdown = null;
    activeTrigger = null;
    activeSelect = null;
  }

  function selectCountry(country, trigger, select) {
    // 1. Update native/hidden select/input value
    select.value = country.code;
    
    // If it's a select element and doesn't have this option yet, add it
    if (select.tagName === 'SELECT') {
      let opt = Array.from(select.options).find(o => o.value === country.code);
      if (!opt) {
        opt = new Option(`${country.flag} ${country.code}`, country.code, true, true);
        select.add(opt);
      }
      select.value = country.code;
    }

    // 2. Update trigger UI
    trigger.querySelector('.cp-flag').textContent = country.flag;
    trigger.querySelector('.cp-code').textContent = country.code;
    trigger.setAttribute('title', `${country.name} (${country.code})`);

    // 3. Dispatch native change & input events so forms and Zoho lead collector catch it
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.dispatchEvent(new Event('input', { bubbles: true }));

    // 4. Apply India 10-digit limit (or relax it) and focus the phone input
    const parentGroup = trigger.closest('.lid-phone-group, .phone-row, .curr-phone-row, .form-group, .brochure-phone') || trigger.parentElement;
    if (parentGroup) {
      const phoneInput = parentGroup.querySelector('input[type="tel"], input[name="phone"], #popPhone, #fPhone, #mPhone, #unlockPhone, #brochurePhone');
      if (phoneInput) {
        applyPhoneDigitLimit(select, phoneInput);
        phoneInput.focus();
      }
    }

    closeDropdown();
  }

  function openDropdown(trigger, select) {
    if (activeTrigger === trigger && activeDropdown && activeDropdown.classList.contains('cp-open')) {
      closeDropdown();
      return;
    }

    let dropdown = document.querySelector('.lime-cp-dropdown');
    if (!dropdown) {
      dropdown = createDropdownElement();
    }

    activeDropdown = dropdown;
    activeTrigger = trigger;
    activeSelect = select;

    const currentCode = select.value || '+91';
    const searchInput = dropdown.querySelector('.lime-cp-search-input');
    searchInput.value = '';

    renderList(dropdown, '', currentCode);
    positionDropdown(dropdown, trigger);

    dropdown.classList.add('cp-open');
    trigger.setAttribute('aria-expanded', 'true');
    const isUnifiedTrigger = trigger.classList.contains('lime-cp-unified') || !!trigger.closest('.lid-phone-group:not(.curr-phone-row)');
    if (!isUnifiedTrigger) {
      trigger.style.setProperty('border-color', '#ED3237', 'important');
      trigger.style.setProperty('box-shadow', '0 0 0 3px rgba(237, 50, 55, 0.12)', 'important');
    }

    setTimeout(() => {
      searchInput.focus();
    }, 50);

    // Search input event
    searchInput.oninput = function() {
      renderList(dropdown, searchInput.value, select.value);
    };

    // Keyboard navigation in search
    searchInput.onkeydown = function(e) {
      const listEl = dropdown.querySelector('.lime-cp-list');
      const items = Array.from(listEl.querySelectorAll('.lime-cp-item'));
      const highlighted = listEl.querySelector('.lime-cp-item.cp-highlighted') || items[0];
      let currentIndex = items.indexOf(highlighted);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          if (highlighted) highlighted.classList.remove('cp-highlighted');
          items[currentIndex + 1].classList.add('cp-highlighted');
          items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          if (highlighted) highlighted.classList.remove('cp-highlighted');
          items[currentIndex - 1].classList.add('cp-highlighted');
          items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const targetItem = highlighted || items[0];
        if (targetItem && targetItem.dataset.code) {
          const c = COUNTRIES.find(x => x.code === targetItem.dataset.code && x.name === targetItem.dataset.name) || {
            code: targetItem.dataset.code,
            flag: targetItem.dataset.flag,
            name: targetItem.dataset.name
          };
          selectCountry(c, trigger, select);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
      }
    };

    // List item click
    dropdown.querySelector('.lime-cp-list').onclick = function(e) {
      const item = e.target.closest('.lime-cp-item');
      if (!item || !item.dataset.code) return;
      const c = COUNTRIES.find(x => x.code === item.dataset.code && x.name === item.dataset.name) || {
        code: item.dataset.code,
        flag: item.dataset.flag,
        name: item.dataset.name
      };
      selectCountry(c, trigger, select);
    };
  }

  // Global listeners for closing
  document.addEventListener('click', function(e) {
    if (!activeDropdown) return;
    if (activeTrigger && (activeTrigger === e.target || activeTrigger.contains(e.target))) {
      return;
    }
    if (activeDropdown && (activeDropdown === e.target || activeDropdown.contains(e.target))) {
      return;
    }
    closeDropdown();
  });

  window.addEventListener('resize', function() {
    if (activeDropdown && activeTrigger) {
      positionDropdown(activeDropdown, activeTrigger);
    }
  }, { passive: true });

  window.addEventListener('scroll', function() {
    if (activeDropdown && activeTrigger) {
      positionDropdown(activeDropdown, activeTrigger);
    }
  }, { passive: true });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && activeDropdown) {
      closeDropdown();
    }
  });

  // Attach searchable picker to a single select/input element
  // Attach searchable picker to a single select/input element
  function attachCountryPicker(select) {
    if (select.dataset.cpInitialized === 'true') return;
    select.dataset.cpInitialized = 'true';
    injectStyles();

    // Hide native select/input
    select.style.setProperty('display', 'none', 'important');

    const currentVal = select.value || '+91';
    const country = findCountry(currentVal);

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lime-cp-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('title', `${country.name} (${country.code})`);

    const isBrochure = !!select.closest('.brochure-phone');
    const isCurrModal = !!select.closest('.curr-phone-row');
    const isUnifiedGroup = !!select.closest('.lid-phone-group:not(.curr-phone-row)');

    if (isCurrModal) trigger.classList.add('lime-cp-curr-modal');
    if (isBrochure) trigger.classList.add('lime-cp-brochure');
    if (isUnifiedGroup) trigger.classList.add('lime-cp-unified');

    if (isUnifiedGroup) {
      trigger.style.cssText = 'display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-direction:row!important;gap:6px!important;background:#ffffff!important;border:none!important;border-right:1.5px solid #d5d5d5!important;border-radius:0!important;padding:0 11px!important;font-family:inherit!important;font-size:13px!important;font-weight:600!important;color:#1e293b!important;cursor:pointer!important;outline:none!important;user-select:none!important;white-space:nowrap!important;flex:none!important;flex-shrink:0!important;height:100%!important;min-height:40px!important;box-sizing:border-box!important;box-shadow:none!important;';
    } else if (isBrochure) {
      trigger.style.cssText = 'display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-direction:row!important;gap:6px!important;background:#ffffff!important;border:1px solid #E5E5E5!important;border-radius:10px!important;padding:0 10px!important;font-family:inherit!important;font-size:13.5px!important;font-weight:500!important;color:#1A1A1A!important;cursor:pointer!important;outline:none!important;user-select:none!important;white-space:nowrap!important;flex:none!important;flex-shrink:0!important;height:42px!important;box-sizing:border-box!important;box-shadow:none!important;transition:border-color .2s ease, box-shadow .2s ease!important;';
    } else {
      trigger.style.cssText = 'display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-direction:row!important;gap:6px!important;background:#ffffff!important;border:1.5px solid #E2E4E8!important;border-radius:9px!important;padding:0 10px!important;font-family:inherit!important;font-size:13.5px!important;font-weight:500!important;color:#1A1A1A!important;cursor:pointer!important;outline:none!important;user-select:none!important;white-space:nowrap!important;flex:none!important;flex-shrink:0!important;height:42px!important;box-sizing:border-box!important;box-shadow:none!important;transition:border-color .2s ease, box-shadow .2s ease!important;';
    }

    if (!isUnifiedGroup) {
      const defaultBorder = isBrochure ? '#E5E5E5' : '#E2E4E8';
      trigger.addEventListener('focus', function() {
        trigger.style.setProperty('border-color', '#ED3237', 'important');
        trigger.style.setProperty('box-shadow', '0 0 0 3px rgba(237, 50, 55, 0.12)', 'important');
      });
      trigger.addEventListener('blur', function() {
        if (trigger.getAttribute('aria-expanded') !== 'true') {
          trigger.style.setProperty('border-color', defaultBorder, 'important');
          trigger.style.setProperty('box-shadow', 'none', 'important');
        }
      });
    }
    trigger.innerHTML = `
      <span class="cp-flag" style="font-size:17px;line-height:1;display:inline-flex;align-items:center;flex-shrink:0;">${country.flag}</span>
      <span class="cp-code" style="font-weight:600;font-size:13px;color:#1e293b;letter-spacing:-0.2px;flex-shrink:0;">${country.code}</span>
      <svg class="cp-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-flex;align-items:center;color:#64748b;margin-left:2px;flex-shrink:0;">
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Insert trigger right before the hidden select
    select.parentNode.insertBefore(trigger, select);
    applyPhoneDigitLimit(select);

    // Click handler
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openDropdown(trigger, select);
    });

    // Keyboard focus on trigger
    trigger.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown(trigger, select);
      }
    });

    // Sync if value changed externally
    select.addEventListener('change', function() {
      const c = findCountry(select.value);
      trigger.querySelector('.cp-flag').textContent = c.flag;
      trigger.querySelector('.cp-code').textContent = c.code;
      trigger.setAttribute('title', `${c.name} (${c.code})`);
      applyPhoneDigitLimit(select);
    });
  }

  // Scan and initialize all country code elements on the page
  function initAllCountryPickers() {
    const targets = document.querySelectorAll(`
      select[name="country_code"],
      select.lid-country-select,
      select.phone-select,
      select.curr-country-select,
      select#fCountryCode,
      select#mCountryCode,
      select#popCountryCode,
      select#brochureCountryCode
    `);

    targets.forEach(attachCountryPicker);
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllCountryPickers);
  } else {
    initAllCountryPickers();
  }

  // Expose globally for dynamic modals or SPA navigation
  window.initCountryPickers = initAllCountryPickers;

  // ── Site-wide India rule: +91 numbers must be exactly 10 digits ──
  // Enforced at document level (capture phase) so it covers every form —
  // including ones that submit via JS handlers and phone fields with no
  // country selector at all (those are India-only, so treated as +91).
  const PHONE_GROUP = '.lid-phone-group, .phone-row, .curr-phone-row, .brochure-phone, .lf-phone, .form-group, .curr-form-group';
  const CODE_SELECT = 'select[name="country_code"], select.lid-country-select, select.curr-country-select, select.phone-select, select[id*="CountryCode"]';
  const isPhone = (el) => el && el.tagName === 'INPUT' && (el.type === 'tel' || el.name === 'phone');
  function codeFor(input) {
    const group = input.closest(PHONE_GROUP);
    const select = (group && group.querySelector(CODE_SELECT)) || (input.form && input.form.querySelector(CODE_SELECT));
    return select ? select.value : '+91';
  }

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!isPhone(el)) return;
    let digits = el.value.replace(/\D/g, '');
    if (codeFor(el) === '+91') digits = digits.slice(0, 10);
    if (digits !== el.value) el.value = digits;
    el.setCustomValidity('');
  }, true);

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form || form.classList.contains('lf')) return; // LimeForm validates itself
    const bad = Array.from(form.querySelectorAll('input[type="tel"], input[name="phone"]')).find((el) => {
      const digits = el.value.replace(/\D/g, '');
      return codeFor(el) === '+91' && (digits.length !== 10 && (digits.length > 0 || el.required));
    });
    if (!bad) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    bad.setCustomValidity('Please enter a valid 10-digit mobile number.');
    bad.reportValidity();
    bad.focus();
  }, true);

  function tagIndianPhones() {
    document.querySelectorAll('input[type="tel"], input[name="phone"]').forEach((el) => {
      if (codeFor(el) !== '+91') return;
      el.setAttribute('maxlength', '10');
      el.setAttribute('pattern', '[0-9]{10}');
      el.setAttribute('inputmode', 'numeric');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tagIndianPhones);
  } else {
    tagIndianPhones();
  }
})();

