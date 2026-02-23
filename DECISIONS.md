# DECISIONS.md

Use this file as a lightweight ADR (Architecture Decision Record) log.

## How to use this file well

- Add one entry per important decision.
- Include context, options, and consequences.
- Record decisions **before** implementation when possible.
- If a decision changes, create a superseding entry instead of rewriting history.

## Decision record template

## DEC-0001: [Decision title]
- **Date:** YYYY-MM-DD
- **Status:** proposed | accepted | deprecated | superseded
- **Owners:**
- **Related docs:** `ARCHITECTURE.md`, `PLANS.md`, issue links

### Context
What problem are we solving and why now?

### Options considered
1. Option A
2. Option B
3. Option C

### Decision
What we chose and why.

### Consequences
- Positive:
- Negative / trade-offs:
- Follow-up actions:

---

## Index
| ID | Title | Status | Date |
|---|---|---|---|
| DEC-0001 | URL as the source of truth for shareable view state | accepted | 2026-02-23 |

## DEC-0001: URL as the source of truth for shareable view state
- **Date:** 2026-02-23
- **Status:** accepted
- **Owners:** Product + Engineering
- **Related docs:** `ARCHITECTURE.md`, `PLANS.md`

### Context
We want app states to be easy to copy, share, paste, test, and reproduce across devices and team members (especially QA and support). Keeping important view state only in in-memory client state makes exact reproduction difficult.

### Options considered
1. Keep all state in component/store memory.
2. Persist most state in local/session storage.
3. Put reproducible, non-sensitive view state in URL (path/query) and keep ephemeral/private state elsewhere.

### Decision
Adopt a hybrid strategy with URL-first view state:
- Put reproducible, user-visible view state in the URL (filters, sort, pagination, selected tab, search terms, locale).
- Keep canonical resource identity in route path segments.
- Keep sensitive, private, or highly ephemeral UI state out of URLs (use server session/database, secure cookies, local/session storage, or in-memory state as appropriate).

### Consequences
- Positive:
  - Deep links fully represent current view state.
  - QA/debug workflows improve via shareable URLs.
  - End-to-end tests can assert behavior through explicit URL parameters.
- Negative / trade-offs:
  - Requires consistent parameter naming/validation and defaulting.
  - URL design becomes part of public API and must be versioned thoughtfully.
  - Risk of leaking data if developers place sensitive values in query strings.
- Follow-up actions:
  - Document URL state conventions in `ARCHITECTURE.md`.
  - Add guardrails in code review checklist: no sensitive data in URL params.
