# SEO Content Audit
## https://limedigitalinstitute.org/
### Date: 2026-09-29

---

## SEO Health Score: 84/100

Strong technical foundation (schema, robots.txt with AI-crawler rules, sitemap, security headers, meta tags all present and unique). Main gaps are image format/weight optimization and missing responsive `srcset`.

---

## On-Page SEO Checklist

### Title Tag
- Status: **Pass**
- Current: `Lime Digital Institute | Digital Marketing Course in Rajkot` (59 chars)
- Issues: None — length ideal (50-60), primary keyword ("Digital Marketing Course") near front, brand name at end, unique vs courses.html title. No change needed.

### Meta Description
- Status: **Pass**
- Current: `Master AI-powered digital marketing in Rajkot with live campaigns, 60+ AI tools & 100% placement support. 16 modules, practical training. First 3 days FREE.` (156 chars rendered)
- Issues: None — within 150-160 range, includes keyword, has a clear CTA ("First 3 days FREE"). Unique from courses.html description (verified).

### Heading Hierarchy
- Status: **Needs Work**
- H1 count: 1 — `Best Digital Marketing Courses with AI in India` (correct, differs from title, but targets "India" not "Rajkot" — slight mismatch with the site's strong local-SEO play everywhere else)
- H2 count: 14, H3 count: 22 — good structural depth
- Issue: H1 broadens to "India" while title/meta/schema all localize to Rajkot. Recommend aligning H1 to include "Rajkot" (e.g., *"Best AI-Powered Digital Marketing Course in Rajkot"*) so the page's strongest on-page signal matches the local commercial intent you're actually ranking for.

### Image Optimization
- Status: **Needs Work**
- 273 total `<img>` tags, **0 missing `alt`** — excellent, every image has alt text.
- 239/273 (88%) lazy-loaded — good.
- Format breakdown: **148 PNG, 119 JPG, 2 WebP, 2 SVG, 2 JPEG**. Only 2 of 273 images use WebP.
- **0 images use `srcset`** — same full-size file served to mobile and desktop.
- Example: `lime-logo.png` alone is **154KB** — a logo should be under 20KB (SVG or optimized PNG).
- **Recommendation:** convert the PNG/JPG library to WebP (typically 30-50% smaller at equal quality) and add `srcset`/responsive sizes for hero and card images. This is the single highest-impact fix on this page — with 273 images, cumulative weight is likely the biggest drag on LCP on mobile.

### Internal Linking
- Status: **Pass**
- 54 internal links, 10 external (social/tool links). Anchor text sampled is descriptive (page names like "courses.html", "placements.html"), not "click here" patterns.

### URL Structure
- Status: **Pass**
- Flat, lowercase, hyphenated structure (`digital-marketing-professional.html`, `free-masterclass.html`). Readable, keyword-relevant, no query params.

---

## Content Quality (E-E-A-T)
| Dimension | Score | Evidence |
|---|---|---|
| Experience | Present | Alumni success stories, student testimonials sections on page ("Hear From Our Alumni", "Success Stories") |
| Expertise | Present | Named instructor referenced elsewhere (courses.html: "Learn from Paras Sir"), 16-module curriculum depth, 60+ AI tools specificity |
| Authoritativeness | Present | LocalBusiness + EducationalOrganization schema, physical address, social profiles linked (LinkedIn, Instagram, Facebook, YouTube), aggregateRating 4.9/120 reviews in schema |
| Trustworthiness | Strong | HTTPS, HSTS header, CSP, physical address + phone in schema, privacy-relevant security headers all present |

---

## Keyword Analysis
- Primary Keyword: **"digital marketing course Rajkot"**
- Search Intent: Commercial/local (course enrollment) — content matches (pricing/CTA-heavy, not a generic blog)
- Keyword Placement:
  - Title: ✅ present, near front
  - H1: ⚠️ partial ("Digital Marketing Courses" present, "Rajkot" missing — replaced with "India")
  - First 100 words: ✅
  - Meta description: ✅
  - URL: N/A (homepage)
- Density: "digital marketing" appears 25× in ~2,547 words (0.98%) — natural, not stuffed. "Rajkot" appears 11×, "AI" appears 65× — consistent with the AI-focused positioning.
- Secondary keywords already well-covered by content: "AI tools", "live campaigns", "placement assistance", "16 modules".

---

## Technical SEO

| Check | Result |
|---|---|
| robots.txt | ✅ Present, allows all major crawlers **including AI/GEO bots** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, anthropic-ai) — ahead of most competitors on AI-search readiness |
| sitemap.xml | ✅ Present, referenced in robots.txt, includes courses/subdomain with proper priorities and lastmod dates |
| llms.txt | ✅ Present (200 OK) — rare, strong GEO signal |
| Canonical tag | ✅ Self-referencing, correct |
| Viewport meta | ✅ Present |
| Robots meta | ✅ `index, follow` |
| Compression | ✅ gzip enabled |
| Security headers | ✅ CSP, HSTS, X-Frame-Options, X-Content-Type-Options all present |
| Asset caching | ✅ Static assets cached 1 year (`max-age=31536000`); HTML correctly set `no-cache` so updates propagate |
| TTFB | ✅ 243ms — good |
| Schema markup | ✅ LocalBusiness, EducationalOrganization, WebSite, Course — comprehensive |

No technical red flags. This is a well-engineered SEO base — better than most sites in this category.

---

## Content Gap Analysis
| Missing Topic | Search Volume Potential | Competition | Content Type Needed | Priority |
|---|---|---|---|---|
| "digital marketing course fees Rajkot" | Med | Med | Dedicated pricing/FAQ page or section | 2 |
| "digital marketing jobs after course" | Med | Low | Blog/landing section (placement outcomes detail) | 3 |
| Comparison content ("Lime vs [local competitor]") | Low-Med | Low | Comparison page | 4 |
| City-adjacent queries ("digital marketing course near Rajkot" / Gujarat-wide) | Med | Low | Additional local landing pages (Gujarat-wide) | 3 |

---

## Featured Snippet Opportunities
- No FAQ schema detected on homepage despite a "Still Have Doubts? We Have Answers" (FAQ-style) H2 section — add `FAQPage` JSON-LD here to compete for "People Also Ask" and snippet boxes for queries like "is digital marketing course worth it in Rajkot".

---

## Schema Markup
| Schema Type | Status |
|---|---|
| LocalBusiness | ✅ Present |
| EducationalOrganization | ✅ Present |
| WebSite | ✅ Present |
| Course | ✅ Present |
| FAQPage | ❌ Missing (page has FAQ-shaped content — easy win) |
| BreadcrumbList | ❌ Missing (low priority for a single-page-deep homepage) |

---

## Internal Linking Opportunities
- Site already links homepage → courses.html → digital-marketing-professional.html cleanly.
- Consider adding a direct in-content link from the homepage's "Why Digital Marketing Pays Off" section to a dedicated placements/outcomes page for topical reinforcement.

---

## Core Web Vitals
Not measured live (no Lighthouse/PSI run in this pass), but structural indicators:
- 273 images with only 2 WebP and 0 responsive `srcset` is the clearest LCP/page-weight risk on mobile.
- TTFB (243ms) and gzip compression are solid — server-side isn't the bottleneck; image payload is.

**Recommendation:** run PageSpeed Insights after the WebP/srcset conversion to quantify the LCP improvement.

---

## Content Strategy Recommendations
1. Keep publishing local-intent pages (course fees, placements detail, Gujarat-wide landing pages) — the technical/GEO foundation is already ahead of competitors, so content depth is now the lever.
2. Add FAQPage schema to the existing "Still Have Doubts" section — near-zero effort, direct snippet upside.
3. Prioritize image pipeline (WebP + srcset) before adding more visual content, since every new PNG/JPG compounds the existing weight problem.

---

## Prioritized Recommendations

### Critical (Fix Immediately)
1. None — no broken meta, no missing alt text, no indexability issues. Site is technically sound.

### High Priority (This Month)
1. Convert image library to WebP (start with `lime-logo.png` at 154KB and hero/card images) — biggest single lever on page speed and mobile LCP.
2. Add `srcset`/responsive image sizes for hero and card images.
3. Add `FAQPage` JSON-LD to the "Still Have Doubts? We Have Answers" section.

### Medium Priority (This Quarter)
1. Align H1 to include "Rajkot" to match the local-commercial intent already reinforced everywhere else (title, meta, schema).
2. Build out a dedicated pricing/fees page or section for "digital marketing course fees Rajkot" queries.

### Low Priority (When Resources Allow)
1. Add BreadcrumbList schema.
2. Build Gujarat-wide local landing pages beyond Rajkot.
3. Add a competitor-comparison page.
