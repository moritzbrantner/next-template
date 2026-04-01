# next-template

Syncable Next.js application template powered by `Copier`.

## What lives here
- `copier.yml`: template questions and defaults
- `template/`: the actual application skeleton
- generic CI, Playwright, Tailwind 4, and package-wiring defaults

## Current package wiring
- The template consumes `@platform/ui` and `@platform/storytelling`.
- Default dependency values point to local sibling packages so this workspace can be verified end-to-end before GitHub Packages publishing.
- Before using the template outside this workspace, override those dependency values to your published package versions or GitHub Packages scope.

## Usage

Create a new app:

```bash
copier copy . ../my-next-app
```

Update an existing app that tracks the template:

```bash
copier update
```

## Template authority

The authoritative app skeleton is under [`template/`](./template). Legacy root-level application files are transitional and can be removed in a follow-up cleanup pass once downstream repositories are aligned.
