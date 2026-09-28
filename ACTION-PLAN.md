# SEO Action Plan — Lime Digital Institute

- **Target Site**: `https://limedigitalinstitute.org/`
- **Baseline Score**: 61/100
- **Target Post-Implementation Score**: 90+/100
- **Implementation Strategy**: Phased rollout ordered by Impact / Effort ratio.

---

## Phase 1: Immediate Blockers (Critical — Within 24-48 Hours)

| # | Task | Area | Impact | Effort | Files Affected |
| :-: | :--- | :---: | :---: | :---: | :--- |
| **1.1** | **Deploy `robots.txt`**<br>Allow crawlers, protect `/api/` and `/lime-admin/`, point to sitemap. | Technical | High | Low | `robots.txt` |
| **1.2** | **Deploy `sitemap.xml`**<br>List all canonical public URLs with priority and modification timestamps. | Technical | High | Low | `sitemap.xml` |
| **1.3** | **Add Canonical Tag to Homepage**<br>`<link rel="canonical" href="https://limedigitalinstitute.org/">` | Technical | High | Low | `index.html` |
| **1.4** | **Inject JSON-LD Schema Markup**<br>Add `EducationalOrganization`, `LocalBusiness`, and `WebSite` structured data. | Schema | High | Medium | `index.html` |
| **1.5** | **Pre-render Stat Counters in HTML**<br>Replace `0` fallback inside counter spans with `800+`, `93%`, `60+`, `4.9/5`. | Content/GEO | High | Low | `index.html` |

---

## Phase 2: Social Discovery & Brand Authority (High — Within 1 Week)

| # | Task | Area | Impact | Effort | Files Affected |
| :-: | :--- | :---: | :---: | :---: | :--- |
| **2.1** | **Add Open Graph & Twitter Cards**<br>Add full set of OG (`og:title`, `og:image`, `og:url`) and Twitter tags with banner. | Social / Meta | High | Low | `index.html` |
| **2.2** | **Deploy Security Headers in `.htaccess`**<br>Add HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. | Technical/Security | Medium | Low | `.htaccess` |
| **2.3** | **Optimize Title & Meta Description**<br>Tune title to ~55-60 chars and description to ~150-155 chars to avoid SERP ellipsis. | On-Page | Medium | Low | `index.html` |
| **2.4** | **Deploy `/llms.txt` for AI Crawlers**<br>Provide clean markdown summary for Perplexity, ChatGPT Search, and Claude. | AI Search (GEO) | Medium | Low | `llms.txt` |

---

## Phase 3: Technical Polish & Internal Links (Medium — Within 2 Weeks)

| # | Task | Area | Impact | Effort | Files Affected |
| :-: | :--- | :---: | :---: | :---: | :--- |
| **3.1** | **Add Accessible Labels to Icon Links**<br>Ensure all 15 icon-only buttons have descriptive `aria-label` or anchor text. | On-Page / A11y | Medium | Low | Global templates |
| **3.2** | **Promote Orphan Pages (`event.html`)**<br>Add internal links from navigation menu or homepage banner to masterclass events. | Internal Links | Medium | Low | `index.html`, `main.js` |
| **3.3** | **Add Explicit Image Dimensions**<br>Specify `width` and `height` attributes on top logo images to prevent CLS. | Performance / CWV | Medium | Medium | `assets/style.css`, HTML |
| **3.4** | **Add Course Schema to Course Pages**<br>Add specific `Course` JSON-LD schemas to `courses.html` and `digital-marketing-professional.html`. | Schema | High | Medium | `courses.html`, `dmp.html` |

---

## Verification & Monitoring Checklist

- [ ] Verify `https://limedigitalinstitute.org/robots.txt` returns HTTP 200.
- [ ] Verify `https://limedigitalinstitute.org/sitemap.xml` parses with zero errors in Google Search Console.
- [ ] Test rich snippets on Google Rich Results Test (`https://search.google.com/test/rich-results`).
- [ ] Test social cards on Facebook Sharing Debugger and Twitter Card Validator.
- [ ] Monitor index coverage and Core Web Vitals in Google Search Console.
