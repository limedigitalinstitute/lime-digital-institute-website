# Full Website SEO Audit Report — Lime Digital Institute

- **Target URL**: `https://limedigitalinstitute.org/`
- **Audit Date**: 2026-09-28
- **Audit Scope**: Full Website Audit (Technical, On-Page, Schema, Content Quality, E-E-A-T, AI Search / GEO, Security)
- **Overall SEO Health Score**: **61 / 100** *(Rating: Needs Improvement)*
- **Score Confidence**: High (Direct HTTP/2 verification, script telemetry & raw HTML DOM analysis)

---

## 1. Executive Summary

Lime Digital Institute has an exceptional, high-converting visual design, strong educational copywriting (1,021 words), comprehensive curriculum breakdown, and prominent student case studies. However, the site currently suffers from several **foundational SEO blockers** that severely limit its search visibility, indexing reliability, and social sharing appearance:

### Top Critical Issues
1. **Zero Schema Markup (0/100)**: No JSON-LD structured data exists on the site. Search engines lack machine-readable definitions for `EducationalOrganization`, `LocalBusiness` (Rajkot campus), or `Course` entities.
2. **Missing `robots.txt` & `sitemap.xml` (404 Not Found)**: Crawlers have no XML sitemap guide and no directives protecting private API/admin directories (`/api/`, `/lime-admin/`, `/data/`).
3. **Missing Canonical Tag**: No `<link rel="canonical">` is specified on the homepage, causing split equity risks across parameterized URLs and trailing slashes.
4. **Missing Open Graph & Twitter Cards (0/100)**: Sharing `https://limedigitalinstitute.org/` on WhatsApp, LinkedIn, X, or Facebook generates no rich snippet, title, or branded preview image.
5. **Raw HTML Counter Stat Fallback shows `0`**: Because counter animations rely on clientside JavaScript without server pre-rendering, search engines and AI crawlers index `"0+ Students Placed"`, `"0% Placed Within 60 Days"`, `"0+ Live Industry Tools"`, and `"0/5 Average Student Rating"`.

### Top 5 Quick Wins
1. Add standard `robots.txt` and `sitemap.xml` to the web root.
2. Inject a canonical tag: `<link rel="canonical" href="https://limedigitalinstitute.org/">`.
3. Add Open Graph & Twitter meta tags with a high-resolution 1200x630 banner (`assets/lime-og-banner.png`).
4. Pre-render actual numbers in HTML counter spans (`800+`, `93%`, `60+`, `4.9/5`).
5. Add rich JSON-LD `EducationalOrganization` + `LocalBusiness` schema with Rajkot geo-coordinates and phone numbers.

---

## 2. Category Scorecard

| Category | Weight | Score | Status | Key Driver |
| :--- | :---: | :---: | :---: | :--- |
| **Technical SEO** | 25% | **55 / 100** | ⚠️ Warning | 404 on robots.txt & sitemap.xml; missing canonical tag |
| **Content Quality & E-E-A-T** | 20% | **85 / 100** | ✅ Good | Rich curriculum, student case studies, alumni quotes |
| **On-Page SEO** | 15% | **78 / 100** | ✅ Good | Clear H1/H2 hierarchy; title & meta description slightly over length limit |
| **Schema / Structured Data** | 15% | **0 / 100** | 🔴 Critical | Zero JSON-LD tags found across entire page |
| **Performance (CWV)** | 10% | **75 / 100** | ✅ Good | Fast HTTP/2 responses; missing explicit image dimensions on certain elements |
| **Image Optimization** | 10% | **85 / 100** | ✅ Good | 100% of images have alt text; explicit width/height needed on 7 logos |
| **AI Search Readiness (GEO)** | 5% | **35 / 100** | 🔴 Critical | No `/llms.txt`; factual claims lack structured entity citation markup |
| **Weighted Overall Score** | **100%** | **61 / 100** | **Needs Improvement** | |

---

## 3. Comprehensive Findings Table

| Area | Severity | Confidence | Finding | Evidence | Fix |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Schema** | 🔴 Critical | Confirmed | Complete absence of JSON-LD structured data | `grep "application/ld+json"` returned 0 results | Inject `EducationalOrganization`, `LocalBusiness`, and `WebSite` JSON-LD schema |
| **Technical** | 🔴 Critical | Confirmed | `robots.txt` returns HTTP 404 | `GET /robots.txt` → 404 Not Found | Create `/robots.txt` pointing to sitemap and disallowing `/api/`, `/data/`, `/lime-admin/` |
| **Technical** | 🔴 Critical | Confirmed | `sitemap.xml` returns HTTP 404 | `GET /sitemap.xml` → 404 Not Found | Create comprehensive `/sitemap.xml` covering all 20 active public pages |
| **Technical** | 🔴 Critical | Confirmed | Missing canonical link tag on homepage | `<link rel="canonical">` not present in `<head>` | Add `<link rel="canonical" href="https://limedigitalinstitute.org/">` |
| **Social / Meta** | 🔴 Critical | Confirmed | Zero Open Graph & Twitter Card tags | `og:title`, `og:image`, `twitter:card` all missing | Add complete OG and Twitter tags to `<head>` |
| **Content / GEO** | 🔴 Critical | Confirmed | Counter numbers render as `0` in raw HTML source | `<span class="counter" data-target="60">0</span>` | Pre-render real values (`800+`, `93%`, `60+`, `4.9`) inside span tags |
| **Security** | ⚠️ Warning | Confirmed | Missing 6 HTTP security headers | Missing HSTS, CSP, X-Frame-Options, X-Content-Type-Options | Add security header directives to Apache `.htaccess` |
| **On-Page** | ⚠️ Warning | Confirmed | Title tag is 72 characters (truncation risk) | Title: `Lime Digital Institute \| Premier Digital Marketing & AI Training in Rajkot` | Shorten to 55-60 chars: `Lime Digital Institute \| Digital Marketing & AI Training Rajkot` |
| **On-Page** | ⚠️ Warning | Confirmed | Meta description is 191 characters (truncation risk) | Length: 191 chars (exceeds Google SERP limit of ~155 chars) | Trim to ~155 characters for clean SERP snippet presentation |
| **AI Search** | ⚠️ Warning | Confirmed | Missing `/llms.txt` for AI model scraping | `GET /llms.txt` → 404 Not Found | Add `/llms.txt` highlighting institute programs, campus location, and curriculums |
| **Internal Links**| ⚠️ Warning | Confirmed | 15 internal links missing descriptive anchor text | Detected icon links without `aria-label` or text | Add descriptive `aria-label` or anchor text to all icon buttons |
| **Internal Links**| ℹ️ Info | Confirmed | `event.html` has only 1 incoming internal link | Internal crawler detected low link depth for masterclasses | Add links to masterclasses/events from header or resources menu |

---

## 4. Ready-to-Deploy Fixes & Code Snippets

### Fix 1: Create `robots.txt`
Create `/robots.txt` in the web root:
```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /data/
Disallow: /lime-admin/

# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://limedigitalinstitute.org/sitemap.xml
```

---

### Fix 2: Create `sitemap.xml`
Create `/sitemap.xml` in the web root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://limedigitalinstitute.org/</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://courses.limedigitalinstitute.org/</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/courses.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/digital-marketing-professional.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/3-day-demo-class.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/about.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/placements.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/contact.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://limedigitalinstitute.org/alumni.html</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

---

### Fix 3: Inject Canonical, Meta & Social Tags into `<head>`
```html
<!-- Canonical -->
<link rel="canonical" href="https://limedigitalinstitute.org/">

<!-- Optimized Title & Description -->
<title>Lime Digital Institute | Digital Marketing & AI Training Rajkot</title>
<meta name="description" content="Master AI-powered digital marketing with live client campaigns, 60+ tools & 100% placement support in Rajkot. Claim your 3-day free trial class today.">

<!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://limedigitalinstitute.org/">
<meta property="og:title" content="Lime Digital Institute | Premier Digital Marketing & AI Training">
<meta property="og:description" content="16+ Modules, 316+ Lectures, 60+ AI Tools & 100% placement assistance in Rajkot. First 3 days FREE.">
<meta property="og:image" content="https://limedigitalinstitute.org/assets/lime-logo.png">
<meta property="og:site_name" content="Lime Digital Institute">
<meta property="og:locale" content="en_IN">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://limedigitalinstitute.org/">
<meta name="twitter:title" content="Lime Digital Institute | Digital Marketing & AI Training">
<meta name="twitter:description" content="Learn modern marketing with AI tools, live simulations & placement support in Rajkot.">
<meta name="twitter:image" content="https://limedigitalinstitute.org/assets/lime-logo.png">
```

---

### Fix 4: Inject JSON-LD Schema Markup
Add before `</head>`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "LocalBusiness"],
      "@id": "https://limedigitalinstitute.org/#organization",
      "name": "Lime Digital Institute",
      "url": "https://limedigitalinstitute.org/",
      "logo": "https://limedigitalinstitute.org/assets/lime-logo.png",
      "image": "https://limedigitalinstitute.org/assets/lime-logo.png",
      "description": "Premier digital marketing and AI training institute in Rajkot providing hands-on campaign simulations, 60+ AI tools, and 100% placement assistance.",
      "telephone": "+91-9998887772",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Rajkot",
        "addressRegion": "Gujarat",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 22.3039,
        "longitude": 70.8022
      },
      "sameAs": [
        "https://www.linkedin.com/school/limedigitalinstitute/",
        "https://www.instagram.com/limedigitalinstitute/",
        "https://www.facebook.com/limedigitalinstitute/"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://limedigitalinstitute.org/#website",
      "url": "https://limedigitalinstitute.org/",
      "name": "Lime Digital Institute",
      "publisher": {
        "@id": "https://limedigitalinstitute.org/#organization"
      }
    },
    {
      "@type": "Course",
      "@id": "https://limedigitalinstitute.org/#course-dmp",
      "name": "Digital Marketing Professional Program with AI",
      "description": "Comprehensive practical digital marketing certification covering SEO, Performance Ads, AI Automation, and Analytics.",
      "provider": {
        "@id": "https://limedigitalinstitute.org/#organization"
      },
      "educationalCredentialAwarded": "Certified Digital Marketing Professional",
      "timeRequired": "P3M",
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": ["blended", "onsite"],
        "location": "Rajkot Campus"
      }
    }
  ]
}
</script>
```

---

### Fix 5: Pre-render Stat Counters in HTML Source
In `index.html`:
```html
<!-- Replace fallback '0' with the actual target metric so search bots index real social proof -->
<div class="stat-box">
  <div class="num"><span class="counter" data-target="800">800</span><span class="accent">+</span></div>
  <div class="cap">Students Placed</div>
</div>
<div class="stat-box">
  <div class="num"><span class="counter" data-target="93">93</span><span class="accent">%</span></div>
  <div class="cap">Placed Within 60 Days</div>
</div>
<div class="stat-box">
  <div class="num"><span class="counter" data-target="60">60</span><span class="accent">+</span></div>
  <div class="cap">Live Industry Tools</div>
</div>
<div class="stat-box">
  <div class="num"><span class="counter" data-target="4.9" data-decimal="1">4.9</span><span class="accent">/5</span></div>
  <div class="cap">Average Student Rating</div>
</div>
```

---

### Fix 6: Security Headers in Apache `.htaccess`
```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>
```

---

### Fix 7: Create `/llms.txt` for AI Search / Answer Engines (GEO)
Create `/llms.txt`:
```markdown
# Lime Digital Institute
> Premier Digital Marketing and AI Training Institute in Rajkot, Gujarat, India.

## About
Lime Digital Institute provides agency-grade digital marketing training integrated with 60+ AI tools (ChatGPT, Claude, Gemini, n8n), live client simulations, and placement support.

## Key Offerings
- Digital Marketing Professional (DMP) Program: 3-month comprehensive classroom + practical training.
- 3-Day Free Demo Class: Hands-on trial classes in Rajkot.
- Specializations: Performance Marketing, Meta & Google Ads, Advanced SEO, Generative AI for Growth, Funnel Automation.

## Campus & Contact
- City: Rajkot, Gujarat, India
- Website: https://limedigitalinstitute.org/
- Courses & Demo: https://courses.limedigitalinstitute.org/
- Email: admin@limeinstitute.org
```
