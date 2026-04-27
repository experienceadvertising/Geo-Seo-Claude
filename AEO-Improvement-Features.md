# AEO Improvement — Feature Overview

---

## Core Audit Engine

**URL Analysis** — the heart of the tool. You paste any public URL and the system:
1. Fetches the page with a neutral crawler user-agent
2. Renders it headlessly to capture JavaScript-generated content
3. Compares the raw HTML word count vs. the rendered word count to detect SPA/JS-only content that AI bots can't see
4. Extracts headings, page excerpt, meta tags, title, description, canonical URL, and schema markup

This powers all six scoring pillars below.

---

## AEO Score (0–100)

A single weighted composite shown as a large score ring on the results page. The six pillars and their weights are:

| Pillar | Weight | What it measures |
|---|---|---|
| Citability | 25% | Heading structure, paragraph extractability, content density |
| Brand Authority | 20% | Digital footprint on Wikipedia, Wikidata, LinkedIn, GitHub, Twitter/X |
| Content Quality | 20% | Readability, word count, depth |
| Technical SEO | 15% | HTTPS, canonical, Open Graph, meta tags |
| Structured Data | 10% | Schema.org JSON-LD types present |
| Platform Optimization | 10% | llms.txt presence, AI-specific signals |

Scores below 40 are red (Poor), 40–69 yellow (Moderate), 70+ green (Good).

---

## AI Crawler Access Audit

Checks your `robots.txt` against six AI crawlers by simulating their user-agent strings:
- **GPTBot** (OpenAI training + ChatGPT browsing)
- **ClaudeBot** (Anthropic)
- **PerplexityBot**
- **Google-Extended** (AI Overviews / Gemini)
- **Applebot**
- **meta-externalagent** (Meta AI)

Each shows ALLOWED or BLOCKED with the bot type. Also checks three technical flags: HTTPS, canonical URL, and llms.txt presence.

---

## Brand Authority Signals

Automatically extracts the brand name from the page (using the title, meta tags, and domain name — with abbreviation/partial matching to handle things like "NYT" → "The New York Times"). Then runs live checks against:
- Wikipedia (entity lookup)
- DuckDuckGo Instant Answer API (knowledge panel)
- GitHub (org existence)
- On-page entity markers (mentions of the brand name in structured contexts)

Each source shows FOUND or NONE with a detail snippet.

---

## Schema Markup Review

Parses all `<script type="application/ld+json">` blocks on the page. Splits results into two groups:

**Detected** — schema types found (shown with ✓ green badges)
**Missing** — schema types not found that would be beneficial (shown with ✗ grey badges)

Common types checked include Organization, WebSite, Article, FAQPage, Product, BreadcrumbList, and more.

---

## Citability Blocks

Breaks the page content into heading-anchored sections and grades each one (A through F) based on:
- Word count (too short = lower grade)
- Presence of a clear heading
- Extractability as a standalone answer

Shown in a card grid with the heading, word count, grade badge, and a preview excerpt. The average citability score across all blocks is shown.

---

## JS Rendering Gap Detection

When the tool detects a page uses JavaScript to render its content, it shows an amber warning in the results header comparing:
- **Rendered word count** — what a real user sees
- **Raw HTML word count** — what AI bots actually crawl

For example: "4,200 words · 312 to AI bots" — one of the most impactful signals the tool surfaces.

---

## Per-Platform Scores

A dedicated card on the results page shows an individual score and status description for each AI engine separately:
- ChatGPT
- Claude
- Gemini
- Perplexity

This is a static assessment of how well-optimized the page is for each platform based on audit signals — distinct from the live prompt simulation.

---

## Score Distribution Radar Chart

A hexagonal radar chart showing all six pillar scores plotted visually so you can immediately see which areas are strongest and weakest at a glance.

---

## AI Executive Summary

Powered by **Claude Sonnet**. After analysis data is collected, it sends all signals (scores, crawler status, schema types, brand signals, word counts, page excerpt) to Claude with a structured prompt. Claude returns a markdown briefing covering:
- What the site does well for AEO
- Key weaknesses ranked by impact
- Specific, actionable context tied to the actual page content (not generic advice)

---

## Prioritized Recommendations

A ranked list of up to 12 specific fixes, each tagged with:
- **Priority**: Critical / High / Medium / Low
- **Category**: e.g. Schema, Crawlers, Brand, Content
- **Impact**: description of what fixing it will do
- **Detail**: the specific action to take

Grounded in Princeton/IIT Delhi GEO research (KDD 2024 paper) on what factors actually influence AI citation rates.

---

## Quick Wins & Technical Issues

Two side-by-side cards:
- **Quick Wins** — numbered list of highest-leverage improvements that are low effort
- **Technical Issues** — flagged problems (missing HTTPS, broken canonical, blocked crawlers, etc.)

---

## Prompt Simulation

A full separate page where you can test how AI engines respond to real searches in your category.

### Setup
1. **Brand name** — auto-populated from the audit, editable
2. **Domain** — pulled from the audited URL
3. **Prompts** — enter up to 25 prompts (one per line), or use Auto-generate
4. **Engine selection** — toggle ChatGPT, Claude, Gemini, and/or Perplexity

### Auto-generate Prompts
Sends the brand name, page title, meta description, and AI executive summary to GPT-4o-mini. Generates 8 realistic, audience-appropriate prompts tailored to the site's actual type (B2B community, SaaS tool, marketplace, etc.) — not generic ones. Mixes informational, comparative, how-to, and recommendation intents.

### Simulation Results
For each prompt × engine combination, the tool shows:
- Whether the **brand was mentioned** in the answer
- Whether the **domain was cited** as a source
- A **response excerpt** from the AI
- Which **URLs were cited** (up to 3 per result)

### Summary View
- **AI Visibility Score** (0–100) — overall across all prompts and engines
- **Per-engine** mention rate, citation rate, and average source position
- **Top competing brands** mentioned most frequently across all responses

Previous simulation results are saved and displayed automatically when you return to the page.

---

## Audit History

The home dashboard shows your last 10 audits as a list with the URL, date, and AEO score. Clicking any row goes straight to that result.

---

## Analysis Progress Tracker

While a scan is running, the home page shows a live step-by-step tracker with animated checkmarks as each phase completes:
1. Fetching page
2. Analyzing content
3. Checking crawlers
4. Computing scores
5. Generating insights

Estimated time shown: 20–30 seconds.

---

## Re-scan

On any results page, a "Re-scan URL" button re-runs the full analysis on the same URL and redirects to the new result — useful for checking improvement after making changes.

---

## PDF Report

A "Download PDF Report" button on results generates a formatted PDF of the full audit, suitable for sharing with clients or stakeholders.

---

## Admin Dashboard

Available only to accounts whose emails are on the admin list. Accessible via the Admin link in the navbar. Shows:
- Total users, total audits, audits in the last 24 hours and 7 days
- A full user table with: name, email, sign-up date, last sign-in, audit count, average AEO score, and last audit date

---

## Authentication & Rate Limiting

- Handled by **Clerk** — supports Google OAuth, email/password, and magic links
- All audit data is scoped per user account
- Rate limiting enforced at **20 audits per hour per account**
- SSRF protection prevents the analyzer from being used to probe internal networks
