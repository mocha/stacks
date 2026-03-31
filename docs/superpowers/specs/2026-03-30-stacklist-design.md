# Stacklist Design Spec

**Domain:** techstacks.lol
**Date:** 2026-03-30

## Overview

Stacklist is a directory of developer "stacks" — named acronyms formed by combining technologies (e.g., the LAMP stack = Linux, Apache, MySQL, PHP). Users claim a unique acronym by picking technologies from a curated list, and the platform generates a humorous LLM-written description of what their stack does.

The vibe is silly and fun. The underlying mechanic is a land-grab: each acronym can only be claimed once, and each user only gets one stack. Choose wisely.

## Tech Stack (meta)

- **Framework:** Next.js (App Router)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (GitHub + GitLab OAuth)
- **ORM:** Prisma
- **LLM:** Claude Haiku (description generation + tech suggestion moderation)
- **Hosting:** Vercel
- **Admin tooling:** Local CLI tool connecting directly to Supabase Postgres

## Data Model

### Technologies

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g., "React" |
| slug | text | Unique, URL-friendly identifier for tech pages (`/t/{slug}`). Derived from name, disambiguated if needed (e.g., "apollo", "apollo-graphql"). |
| description | text | Pulled from GitHub |
| logoUrl | text | Pulled from GitHub |
| githubUrl | text | Link to repo |
| githubStars | int | Cached, refreshed daily |
| language | text | Primary language from GitHub |
| status | enum | approved / pending / rejected |
| discoveredBy | uuid | FK to Users. Seeded techs point to @mocha as placeholder, to be enriched later with actual authors |
| createdAt | timestamp | |

### Stacks

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| acronym | text | Unique (case-insensitive via CITEXT or `UPPER()` functional index). This is the canonical identifier and URL slug. |
| creatorId | uuid | FK to Users |
| questionnaire | jsonb | Three free-text answers: industries, notable feature, biggest competitor |
| description | text | LLM-generated, stored permanently |
| rerollsToday | int | Default 0, resets daily |
| lastRerollDate | date | Tracks when reroll counter was last reset |
| createdAt | timestamp | |

### StackTechnologies (join table)

| Column | Type | Notes |
|--------|------|-------|
| stackId | uuid | FK to Stacks |
| technologyId | uuid | FK to Technologies |
| position | int | Order matters — position determines the letter contributed to the acronym |

### Users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| provider | text | github / gitlab |
| providerUsername | text | |
| displayName | text | |
| avatarUrl | text | |
| profileUrl | text | |
| hasStack | boolean | Enforces one-stack-per-user rule |
| createdAt | timestamp | |

### Star Count

Not stored on stacks. Computed on read by summing `githubStars` of constituent technologies via join. The dataset is small enough that this doesn't need caching — the daily GitHub stars refresh on technologies is sufficient.

## Authentication & Authorization

**Auth provider:** Supabase Auth with GitHub and GitLab OAuth.

**Rules:**
- **Must be logged in:** create a stack, suggest a technology, reroll description, relinquish stack
- **Creator-only:** reroll description, relinquish stack
- **Admin (@mocha):** approve/reject tech suggestions via local CLI tool (not in the web app)
- **Public:** homepage, stack detail pages, tech pages, user profile pages

## Core Flows

### Stack Creation

1. User hits "Design my Stack" on the homepage
2. Stack builder page: typeahead input, one technology per line
3. Typing filters the approved technology list. Pressing `+` or `Enter` adds a new line.
4. If the user types something not in the approved list, it's accepted in-place but flagged. On save, they're prompted to submit a suggestion (name + GitHub URL) for each unknown tech.
5. As they build, the acronym forms live at the top: **"The BURRITO Stack!"** with real-time uniqueness checking. Green check if unique, red X if taken (with a link to the existing stack).
6. User answers three brief questions (free text):
   - "What industries primarily use this stack?"
   - "What is its most notable feature?"
   - "What is its biggest competitor?"
7. On save:
   - Stack record is created
   - LLM description is generated via Haiku and stored
   - User's `hasStack` flips to `true`
   - Redirect to the new stack's detail page

### Technology Suggestion

1. During stack creation, unknown techs trigger a suggestion flow: name + GitHub/GitLab URL
2. Stored as a pending technology with `discoveredBy` set to the suggesting user
3. Haiku performs an automated vibe check on the URL (is it a real project? anything inappropriate?)
4. @mocha approves/rejects via local CLI tool

### Relinquish Stack

1. Creator hits "Relinquish" on their stack detail page
2. Confirmation dialog with the text: **"Yeah it sucks these days anyway"**
3. Stack is deleted, `hasStack` flips to `false`, acronym is freed for someone else to claim

### Reroll Description

1. Creator hits "Reroll" on their stack detail page
2. If under 2 rerolls for the day, a new LLM description is generated and replaces the old one
3. Counter increments; resets daily
4. Future: paid unlimited rerolls ($5)

## LLM Description Generation

**Model:** Claude Haiku

**Prompt structure:**
```
You are a very silly software engineer that has built a software framework
relying on {tech1}, {tech2}, {tech3}, and {tech4}. They do the following:

- {tech1}: {description}
- {tech2}: {description}
- {tech3}: {description}
- {tech4}: {description}

Here's what you know about this stack:
- Industries that primarily use it: {industries_answer}
- Its most notable feature: {notable_feature_answer}
- Its biggest competitor: {competitor_answer}

Another developer is asking you for a concise description of what your
'stack' is and how it works. Explain to them in simple terms what it does,
and what each technology is contributing to it.

Don't worry about it making too much sense functionally, but focus instead
on making sure that every individual technology is being highlighted in
some way.
```

Generated once on stack creation, stored permanently. Creator can reroll (2x/day limit).

**On reroll:** The previous description is summarized to a one-liner and fed back into the prompt as additional context:
```
Some people mistake it for a "{old_stack_one_liner}" but this is
_totally_ different.
```
This gives each regeneration awareness of the last version, so descriptions evolve rather than starting from scratch.

## Pages

### Homepage

- **"Hall of Fame"** — 5 random stacks, re-picked daily via cron
- **"Just Invented"** — most recently created stacks
- **"Design my Stack"** CTA button

### Stack Detail Page — `/s/{ACRONYM}`

- Big banner: **"The BURRITO Stack"**
- Inventor credit: **"Invented by @mocha"** with link to GitHub profile
- Creation date
- Technology list with logos, names, and links to tech pages
- LLM-generated description
- Aggregated GitHub star count (sum of technologies' stars)
- Reroll button (creator only, if under daily limit)
- Relinquish button (creator only)
- Ad placeholder (HTML comment in markup for future use)

**If the acronym is unclaimed:** CTA page inviting the user to claim it.

### Technology Page — `/t/{slug}`

- Name, logo, description (from GitHub)
- Primary language and topline stats
- GitHub link
- Discovered by credit
- List of stacks that use this technology

### User Profile Page — `/u/{username}`

Pulls from GitHub/GitLab API, cached and refreshed on login. Manual "sync" button for the profile owner.

- Avatar, bio, location, company
- Pinned repos
- Top languages
- Contribution activity / stats
- Social links
- Their stack (prominently featured): **"Inventor of the BURRITO Stack"**
- No ads on profile pages

### Stack Builder Page

- Typeahead-driven interface, one tech per line
- Live acronym display and uniqueness checking
- Three-question questionnaire (free text): industries, notable feature, biggest competitor
- Save button (disabled until acronym is unique and at least 2 techs selected)

## Background Jobs

- **Daily GitHub stars refresh:** Cron job that updates `githubStars` for all approved technologies via GitHub API
- **Daily Hall of Fame refresh:** Pick 5 random stacks, cache for the day
- **Daily reroll counter reset:** Reset `rerollsToday` to 0 for all stacks (or handle lazily by comparing `lastRerollDate` to today)

## Canonical Stacks & Seeding

Pre-seeded before launch with real, well-known stacks:
- LAMP, MEAN, MERN, JAM, ELK, AJAX, and others identified via deep research
- Attributed to their actual inventors where traceable
- All seeded technologies have `discoveredBy: @mocha` as a placeholder, to be enriched later with actual authors via a backfill script

### Deep Research Prompt (for identifying canonical stacks)

```
Research the history of named software/technology "stacks" — combinations of
technologies referred to by an acronym or portmanteau. For each one, find:

1. The full name and what each letter stands for
2. Who coined the term (specific person, with source/citation if possible)
3. When it was first used (year, ideally with a link to the original blog post,
   talk, or mailing list message)
4. Whether it's still in active use or considered legacy

Include well-known stacks like LAMP, MEAN, MERN, MEVN, JAM/Jamstack, ELK,
LERN, PERN, TALL, VILT, GRAND, and any others you can find. Cast a wide net —
include obscure or humorous ones too.

For each, provide confidence level (high/medium/low) on the inventor attribution.
```

## Monetization

- One ad slot on stack detail pages (sidebar or below description)
- Currently a commented-out HTML placeholder — no ad vendor selected yet
- No ads on profile pages, homepage, tech pages, or the builder

## URL Structure

- `/` — homepage
- `/s/{ACRONYM}` — stack detail page
- `/t/{slug}` — technology page
- `/u/{username}` — user profile page

All URLs are relative paths. The domain (TBD — `techstacks.lol` used as placeholder throughout this doc) is configured via a single environment variable (`NEXT_PUBLIC_SITE_URL`). No domain is hardcoded anywhere in the codebase.
