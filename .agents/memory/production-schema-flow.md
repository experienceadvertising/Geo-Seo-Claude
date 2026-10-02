---
name: Production schema flow
description: Replit-managed production PostgreSQL schema changes are applied by Publish, not direct production SQL.
---

Production database access is read-only for the agent; additive or other schema changes must be applied through the user-controlled Publish flow.

**Why:** Direct production DDL is unsupported and could bypass Replit's schema-diff and rename confirmation safeguards.

**How to apply:** When a release needs new production tables, verify their presence read-only, prepare the code/configuration, and defer the schema application and live verification until the user publishes.