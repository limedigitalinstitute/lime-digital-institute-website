# Full Audit Report

- URL: `https://limedigitalinstitute.org/`
- Generated: `2026-09-28T10:19:19.409678`
- Overall score: `78/100`
- Score confidence: `Medium`
- Scoring version: `1`

## Score Card

| Category | Weight | Score |
| --- | ---: | ---: |
| Security Headers | 8 | 100 |
| Social Meta | 5 | 85 |
| Robots and Crawlers | 8 | 100 |
| Broken Links | 10 | 88 |
| Internal Links | 8 | 60 |
| Redirects | 3 | 100 |
| AI Search | 5 | 70 |
| Performance and Core Web Vitals | 13 | 0 |
| On-Page SEO | 10 | 100 |
| Readability | 8 | 31 |
| Entity SEO | 5 | 15 |
| Link Profile | 7 | 75 |
| Hreflang | 5 | 0 |
| Content Uniqueness | 5 | 100 |

## Findings

| Severity | Area | Finding | Evidence | Fix |
| --- | --- | --- | --- | --- |
| Critical | broken_links | 🔴 1 broken link(s) found |  |  |
| Critical | link_profile | 2 orphan page(s) with zero inbound internal links. |  | Add internal links from relevant content pages to these orphan pages. |
| Warning | entity | sameAs URL returns HTTP 999: https://www.linkedin.com/school/limedigitalinstitute/ |  | Update sameAs URL for LinkedIn to a valid, non-redirecting destination. |
| Warning | environment | 1 broken links detected | Broken internal links hurt crawl flow and user trust. | Repair or remove broken internal links and refresh outdated navigation targets. |
| Warning | environment | Content readability is difficult | Long, complex text can reduce engagement and comprehension. | Rewrite key sections with shorter sentences (15-20 words), shorter paragraphs (2-4 sentences), and clearer subheadings. |
| Warning | internal_links | ⚠️ 1 potential orphan page(s) (≤1 internal link pointing to them) |  |  |
| Warning | internal_links | ⚠️ 1 page(s) have fewer than 3 internal links |  |  |
| Warning | readability | ⚠️ Content is difficult to read (Flesch: 18.9) — may reduce engagement |  |  |
| Warning | readability | ⚠️ 50.0% complex words (3+ syllables) — consider simplifying |  |  |
| Warning | readability | ⚠️ Thin content (8 words) — may rank poorly |  |  |
| Info | Wikidata | No Wikidata entry found for 'Lime Digital Institute'. |  | If the entity meets Wikidata notability guidelines, create or improve an item with accurate third-party references. Do not create one solely for SEO. |
| Info | Wikipedia | No Wikipedia article found for 'Lime Digital Institute'. |  | Only pursue Wikipedia if the entity meets independent notability standards. Otherwise, strengthen official schema, sameAs profiles, citations, and About/Contact signals. |
| Info | environment | Performance measurement incomplete | PageSpeed API returned an error, so CWV recommendations are less reliable. | Set `PAGESPEED_API_KEY` in your environment or `.env` file (see `.env.example`), then rerun. The CLI also accepts `--api-key`. Prioritize LCP/INP/CLS fixes from that output. |
| info | pagespeed | pagespeed measurement incomplete | Rate limited by Google API. Wait a few minutes or add an API key. | Rerun this check after resolving the environment/API/network limitation. |
| Info | sameAs | Missing sameAs link to Wikipedia (Primary KG signal). |  | Add the existing official 'wikipedia.org' URL to sameAs; do not create this profile solely for SEO. |
| Info | sameAs | Missing sameAs link to Wikidata (Primary KG signal). |  | Add the existing official 'wikidata.org' URL to sameAs; do not create this profile solely for SEO. |
| Info | sameAs | Missing sameAs link to Twitter/X (Strong KG signal). |  | Add 'x.com' profile URL to sameAs array in your entity schema. |

## Measurement Notes

1 checks returned errors or incomplete measurements; treat affected scores as directional.
