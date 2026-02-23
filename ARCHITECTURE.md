# ARCHITECTURE.md

Use this file to document the technical blueprint of the template.

## How to use this file well

- Describe architecture for **future contributors**, not just current maintainers.
- Prefer diagrams + short explanations over long prose.
- Keep implementation details in code, but keep **design rationale** here.
- Update this file when introducing new core dependencies, services, or patterns.
- Record trade-offs and constraints explicitly.

## Architecture principles for this template

1. **Scalable by default:** structure for growth from marketing site to full SaaS.
2. **Composable UI:** reusable components and feature modules.
3. **Performance-first:** Core Web Vitals, streaming, progressive hydration where needed.
4. **Secure by design:** auth boundaries, least-privilege integrations, safe defaults.
5. **Developer experience:** fast setup, clear conventions, automated quality checks.

## System overview template

## 1) Context
- Product type: Comprehensive Next.js app template for high-impact websites and product experiences.
- Key capabilities expected:
  - User management (auth, roles, profiles).
  - Rich 3D animation (Three.js / React Three Fiber).
  - Video-first sections (`react-player` or similar integration pattern).
  - Production forms (validation, async submit, error states).
  - Global client state (Zustand or equivalent).

## 2) High-level diagram
```text
[Browser]
   |
[Next.js App Router]
   |-- [Public Marketing Pages]
   |-- [Authenticated App Area]
   |-- [API Routes / Server Actions]
   |
[Data Layer]
   |-- DB / ORM
   |-- Auth Provider
   |-- File/Media Storage
```

## 3) Module boundaries
| Layer | Responsibility | Suggested Location |
|---|---|---|
| App routing | Route groups, layouts, metadata | `app/` |
| UI system | Shared primitives + composites | `components/` |
| Feature modules | Domain-specific logic/UI | `features/` |
| State | Cross-feature client state | `stores/` |
| Services | API clients, adapters, integrations | `lib/services/` |
| Validation | Schemas and input contracts | `lib/validation/` |

## 4) Runtime split
- **Server Components:** data fetching, SEO-critical content, secure boundaries.
- **Client Components:** interactive scenes, media controls, form interactions.
- **Server Actions/API Routes:** mutations and protected operations.

## 5) Data flow patterns
- Read: route -> server component -> service layer -> data source.
- Write: client interaction -> action/endpoint -> validation -> service -> persistence.
- Client state: local UI state in component; shared UI/session state in Zustand.


## 5.1) URL state conventions (shareable/reproducible state)
- Treat the URL as the source of truth for **shareable, reproducible, non-sensitive view state**.
- Use route segments for canonical resource identity and locale.
- Use query parameters for filters, sort, pagination, tabs, and search state.
- Do **not** store sensitive data, tokens, secrets, or private personal data in URL parameters.
- Keep ephemeral interaction state (temporary toggles, animation-only flags, unsaved local drafts) out of the URL unless explicit deep-linking is required.
- Normalize and validate query parameters at route boundaries to ensure deterministic links and stable tests.

## 5.2) Domain logic once, multi-transport adapters
- Domain logic should be implemented once in `src/domain/**` as pure use-cases/services that do not depend on route handlers or UI components.
- Domain services must return a standardized result contract:
  - success: `{ ok: true, data: ... }`
  - business failure: `{ ok: false, error: { code, message, ... } }`
- Adapters stay thin:
  - API routes (`app/api/**`): validate input, call domain service, map typed domain errors to HTTP status codes and response bodies.
  - UI/server components (`app/[locale]/**`): call domain service (or server action facade), branch on the same typed result shape, and render/redirect accordingly.
- Current authorization use-cases (`viewReports`, `manageUsers`, `manageSystemSettings`) are implemented in `src/domain/authorization/use-cases.ts` and consumed by the admin page route as a thin adapter.

## 6) Non-functional requirements
- Performance budget targets:
  - LCP < 2.5s on key landing pages.
  - CLS < 0.1.
  - Keep bundle size tracked per route.
- Accessibility:
  - Keyboard navigation for interactive media/3D controls.
  - WCAG AA color contrast.
- Observability:
  - Error monitoring and basic analytics hooks.

## 7) Change log
| Date | Change | Author | Notes |
|---|---|---|---|
| YYYY-MM-DD | Initial architecture entry |  |  |
