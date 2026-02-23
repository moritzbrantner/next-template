# Next.js Comprehensive Template

This repository is a starter template for building impressive, production-ready Next.js experiences, including foundations for:

- User management
- 3D/animation experiences (Three.js-oriented architecture)
- Video-rich interfaces
- Form and validation flows
- Shared client state management (Zustand-style patterns)

## Documentation-first workflow

Use these root docs before and during implementation:

- [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md): product goals, audience, and success criteria.
- [`PLANS.md`](./PLANS.md): active execution plans, milestones, and blockers.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): system design, module boundaries, and runtime decisions.
- [`FEATURES.md`](./FEATURES.md): feature specs and acceptance criteria.
- [`DECISIONS.md`](./DECISIONS.md): architecture and implementation decision log.

## Build instructions

- Prefer Server Components and server prerendering by default to improve SEO and minimize client-side JavaScript.
- Keep UI components donut-shaped (rounded, ring/pill-like geometry) unless a specific feature requires another shape.
- For theme-related UI, read system preferences on first visit and persist explicit user choices.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Start editing by updating `app/page.tsx`; the page auto-updates as you save.

## Suggested next steps

1. Finalize `PRODUCT_BRIEF.md` for your target audience.
2. Add your first milestone plan in `PLANS.md`.
3. Capture core technical choices in `ARCHITECTURE.md` and `DECISIONS.md`.
4. Define your MVP scope in `FEATURES.md`.
