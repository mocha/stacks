# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (Next.js 16)
- `npm run build` — generate Prisma client + build (`prisma generate && next build`)
- `npm run lint` — ESLint
- `npm test` — run all tests (`vitest run`)
- `npm run test:watch` — vitest in watch mode
- `npx vitest run src/lib/__tests__/llm.test.ts` — run a single test file
- `npm run admin` — CLI admin tool (`tsx cli/admin.ts`)
- `npx prisma migrate dev` — apply migrations
- `npx prisma db seed` — seed database (`tsx prisma/seed.ts`)

## Architecture

**Stacklist** is a Next.js 16 App Router app where users claim unique technology stack acronyms (e.g., "LAMP", "MERN"). Each stack is a sequence of technologies whose initials spell the acronym. There can be only one owner per acronym.

### Data layer
- **Prisma 7** with the `@prisma/adapter-pg` driver adapter connecting to **Supabase Postgres** (`src/lib/prisma.ts`)
- Schema: `prisma/schema.prisma` — core models are `User`, `Technology`, `Stack`, `StackTechnology` (join with position), `HallOfFame`
- Technologies link to GitHub repos; `githubStars` drives the RPG-style rarity tier system (`src/lib/stars.ts`: normal/magic/rare/epic/legendary)

### Auth
- **Supabase Auth** via `@supabase/ssr` — server client in `src/lib/supabase/server.ts`, browser client in `src/lib/supabase/client.ts`
- Middleware at `src/middleware.ts` refreshes the Supabase session on every request
- OAuth callback handled at `src/app/auth/callback/`

### LLM integration
- `src/lib/llm.ts` — uses **Anthropic SDK** (`claude-haiku-4-5`) to generate stack descriptions and one-line summaries
- `src/lib/moderation.ts` — LLM-based "vibe check" for user-submitted technology URLs

### UI
- **Catalyst UI Kit** — Tailwind CSS component library vendored in `src/components/catalyst/` (headings, buttons, badges, navbar, etc.)
- Fira Code as the primary font
- Dark mode supported via Tailwind `dark:` classes

### Routes
- `/` — homepage with Hall of Fame, Just Invented, Top Contributors
- `/build` — stack builder (in `src/app/build/`)
- `/s/[acronym]` — stack detail page
- `/t/[slug]` — technology detail page
- `/u/[username]` — user profile page
- `/auth/callback` — Supabase OAuth callback

### API routes (`src/app/api/`)
- `stacks/` — CRUD for stacks, `check/` for acronym availability, `[acronym]/reroll/` to regenerate descriptions
- `technologies/` — list, `create/` new, `suggest/` (LLM-powered suggestions)
- `users/[username]/sync/` — sync GitHub profile data
- `cron/refresh-stars/` and `cron/refresh-hall-of-fame/` — scheduled maintenance

### Environment variables
- `DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client config
- `ANTHROPIC_API_KEY` — for LLM calls (used implicitly by the Anthropic SDK)
- `GITHUB_TOKEN` — optional, for higher GitHub API rate limits
