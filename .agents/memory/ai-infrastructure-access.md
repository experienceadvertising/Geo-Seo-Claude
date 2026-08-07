---
name: AI infrastructure access advisories
description: How the audit should present CDN, WAF, and bot-management signals.
---

Infrastructure provider detection is an advisory, never proof that an AI crawler is blocked.

**Why:** A CDN, WAF, or bot-management platform can enforce controls beyond robots.txt, but response headers only identify the platform. They do not reveal the site's actual AI-bot policy.

**How to apply:** Ask users to compare CDN, firewall, WAF, and bot-management rules with robots.txt. Reserve a “blocked” finding for directly observed crawl or robots-policy evidence.