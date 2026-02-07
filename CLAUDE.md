# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run dev:cloud9   # Start dev server on port 8080 (AWS Cloud9)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check (next lint)
```

No test framework is configured. There is no test command.

## Environment Setup

Copy `.env.example` to `.env.local`. The only required variable is `RUNS_API_URL` (upstream API for form submissions). All `NEXT_PUBLIC_*` variables are optional with CDN defaults.

## Architecture

This is a **Next.js 14 App Router** application — a multi-tenant job application form deployed on AWS Amplify. It uses TypeScript, Tailwind CSS, and React 18 with no external state management.

### Multi-Tenancy

Routes use a `[tenant]` dynamic segment (`app/[tenant]/page.tsx`). The root `/` route uses `NEXT_PUBLIC_DEFAULT_TENANT` (defaults to `"default"`). Tenant context flows through component props — there is no global context provider.

### Component Pattern

Pages in `app/` are **server components** that resolve params/searchParams then render client components from `components/`. All interactive components (`ApplyForm`, `ThankYouPage`, `LanguageSwitcher`, etc.) are client components with `"use client"`.

### Key Modules

- **`lib/config.ts`** — Centralized config: env vars, file upload constraints, i18n settings, supported languages. `SupportedLanguage` type is derived here.
- **`lib/theme.ts`** — CDN theme loader with cascading fallback (tenant theme → global theme → built-in defaults). Generates CSS variables consumed by Tailwind.
- **`i18n/index.ts`** — Language detection (query param → cookie → Accept-Language → default) and translation lookup. Translations are static JSON imports from `i18n/locales/`.
- **`app/api/runs/route.ts`** — Server-side API proxy. Forwards form data to `RUNS_API_URL` so the upstream URL is never exposed to the client.

### Theming

Theme colors are injected as CSS custom properties (`--primary-color`, `--secondary-color`, `--background-color`, `--button-radius`) and referenced in `tailwind.config.ts` via `var()`. Theme JSON is fetched from CDN at runtime with a 5-second timeout.

### i18n

Three languages supported: `en`, `pl`, `it`. Add new languages by: (1) creating a JSON file in `i18n/locales/`, (2) importing it in `i18n/index.ts`, (3) adding the code to `config.supportedLanguages` in `lib/config.ts`.

### Deployment

AWS Amplify via `amplify.yml`. Build output is `standalone` mode (configured in `next.config.js`).
