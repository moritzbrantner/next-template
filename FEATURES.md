# FEATURES.md

Use this file to define and track major capabilities in the template.

## How to use this file well

- Treat each feature as a mini-spec with acceptance criteria.
- Keep user-facing behavior, technical notes, and rollout status together.
- Split broad capabilities into smaller feature slices.
- Mark dependencies clearly (e.g., auth needed before dashboard features).

## Feature catalog template

## 1) Core platform features

### Feature: User Management
- **Status:** planned
- **Summary:** Authentication, profile management, role-aware access control.
- **User value:** Enables secure personalization and account-based experiences.
- **Scope includes:** sign up/in/out, password reset, profile edit, role checks.
- **Acceptance criteria:**
  - [ ] Auth flow works end-to-end.
  - [ ] Protected routes block unauthorized users.
  - [ ] User profile data is persisted and editable.
- **Dependencies:** DB, auth provider, email provider.

### Feature: 3D Interactive Experiences
- **Status:** planned
- **Summary:** Three.js-powered sections with performant fallbacks.
- **User value:** Highly engaging brand and product storytelling.
- **Scope includes:** hero scene, scroll-linked animation, graceful degradation.
- **Acceptance criteria:**
  - [ ] 3D scene loads with fallback for low-capability devices.
  - [ ] Animation controls are keyboard accessible where applicable.
  - [ ] Performance stays within agreed budget.
- **Dependencies:** rendering setup, asset pipeline.

### Feature: Video Components
- **Status:** planned
- **Summary:** Reusable video components for background, inline, and modal playback.
- **User value:** Rich media communication without custom player rebuild.
- **Scope includes:** provider abstraction, lazy loading, controls, captions support.
- **Acceptance criteria:**
  - [ ] Component supports common video providers.
  - [ ] Mobile autoplay/controls behavior documented and tested.
  - [ ] Captions and pause controls available.
- **Dependencies:** media strategy, accessibility guidelines.

### Feature: Form System
- **Status:** planned
- **Summary:** Consistent forms with schema validation and async submission.
- **User value:** Reliable lead capture and user data updates.
- **Scope includes:** input components, validation schemas, submission states.
- **Acceptance criteria:**
  - [ ] Errors are clear and field-specific.
  - [ ] Loading, success, and failure states are implemented.
  - [ ] Server-side validation mirrors client-side rules.
- **Dependencies:** validation library, API/actions.

### Feature: Global State (Zustand)
- **Status:** planned
- **Summary:** Shared client state for UX flows requiring cross-component sync.
- **User value:** Smooth interactions across media, layout, and user context.
- **Scope includes:** store conventions, persistence strategy, testing.
- **Acceptance criteria:**
  - [ ] Store slices are domain-scoped.
  - [ ] No sensitive data persisted in insecure storage.
  - [ ] Store usage patterns are documented.
- **Dependencies:** state management conventions.

## 2) Backlog template
| Feature | Priority | Status | Owner | Notes |
|---|---|---|---|---|
|  | P1 | planned |  |  |
