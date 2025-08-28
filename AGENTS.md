# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` with feature-first folders (`src/features/deals`, `src/features/auth`, `src/features/new-transaction`).
- Shared UI/logic: `src/shared/ui/*`, `src/shared/components/*`, `src/shared/lib/*`, `src/lib/utils.ts`.
- App shell: `src/main.tsx`, `src/index.css`, `src/widgets/*`.
- Assets: `public/` and `src/assets/`.
- Path alias: import from `@/…` (configured in `vite.config.ts` and `tsconfig.*`).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Type-check (`tsc -b`) and create production build.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint on the repo.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled). Indentation: 2 spaces.
- Files: React components `PascalCase.tsx`; hooks `useX.ts`; utilities `camelCase.ts`.
- Imports: prefer alias `@/feature/...` over relative `../../`.
- Styling: Tailwind CSS classes; keep class lists readable and reusable via helpers in `shared/lib/utils`.
- Linting: rules from `eslint.config.js` (ESLint, TS, React Hooks, Vite Refresh). Fix issues before PR.

## Testing Guidelines
- Test framework not yet configured. Recommended: Vitest + React Testing Library.
- Naming: co-locate tests as `Component.test.tsx` or place in `__tests__/` under the feature.
- Coverage: target meaningful units (utils, hooks, data mappers). Add a `test` script when introducing tests.

## Commit & Pull Request Guidelines
- Commits: concise, present tense. Prefer Conventional Commits, e.g. `feat(auth): add login form` or `fix(deals): correct date parsing`.
- PRs: include purpose, screenshots for UI changes, steps to validate, and linked issues. Keep PRs scoped to one feature/fix.

## Security & Configuration Tips
- Environment: create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do not commit env files.
- Note: `VITE_`-prefixed vars are exposed to the client—never store secrets beyond intended public keys.

## Architecture Overview
- Stack: React 19 + Vite 7, Tailwind v4, TanStack Query, React Router, Supabase client (`src/shared/supabase/client.ts`).
