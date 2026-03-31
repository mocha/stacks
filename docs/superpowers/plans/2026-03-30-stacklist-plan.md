# Stacklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stacklist — a platform where developers claim unique technology stack acronyms, get silly LLM-generated descriptions, and show off their invention on a profile page.

**Architecture:** Next.js App Router with Supabase (Postgres + Auth). Prisma ORM for data access. Claude Haiku for description generation and content moderation. Vercel for hosting. Local CLI tool for admin operations.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, Supabase (Auth + Postgres), Anthropic SDK (Claude Haiku), Vercel

---

## File Structure

```
stacklab/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # Homepage
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts                  # Supabase OAuth callback
│   │   ├── build/
│   │   │   └── page.tsx                      # Stack builder
│   │   ├── s/
│   │   │   └── [acronym]/
│   │   │       └── page.tsx                  # Stack detail
│   │   ├── t/
│   │   │   └── [slug]/
│   │   │       └── page.tsx                  # Technology detail
│   │   ├── u/
│   │   │   └── [username]/
│   │   │       └── page.tsx                  # User profile
│   │   └── api/
│   │       ├── stacks/
│   │       │   ├── route.ts                  # POST create stack
│   │       │   ├── check/
│   │       │   │   └── route.ts              # GET acronym uniqueness
│   │       │   └── [acronym]/
│   │       │       ├── route.ts              # DELETE relinquish
│   │       │       └── reroll/
│   │       │           └── route.ts          # POST reroll description
│   │       ├── technologies/
│   │       │   ├── route.ts                  # GET search technologies
│   │       │   └── suggest/
│   │       │       └── route.ts              # POST suggest technology
│   │       └── users/
│   │           └── [username]/
│   │               └── sync/
│   │                   └── route.ts          # POST sync GitHub data
│   ├── lib/
│   │   ├── prisma.ts                         # Prisma client singleton
│   │   ├── supabase/
│   │   │   ├── client.ts                     # Browser client
│   │   │   └── server.ts                     # Server client
│   │   ├── llm.ts                            # Haiku description generation
│   │   └── github.ts                         # GitHub API helpers
│   └── components/                           # UI components (deferred to frontend-design)
├── cli/
│   └── admin.ts                              # Local admin CLI
├── .env.local.example
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with App Router, TypeScript, Tailwind, src directory.

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
npm install -D @types/node tsx
```

- [ ] **Step 3: Create environment variable template**

Create `.env.local.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase Postgres direct connection)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: Next.js dev server running on localhost:3000 with default page.

- [ ] **Step 5: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Prisma Schema & Migration

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write the Prisma schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TechnologyStatus {
  approved
  pending
  rejected
}

model User {
  id               String       @id @default(uuid()) @db.Uuid
  provider         String       // "github" or "gitlab"
  providerUsername  String
  displayName      String
  avatarUrl        String?
  profileUrl       String
  hasStack         Boolean      @default(false)
  githubData       Json?        // Cached GitHub profile data
  githubDataSyncedAt DateTime?
  createdAt        DateTime     @default(now())
  supabaseAuthId   String       @unique // Links to Supabase Auth user

  stack             Stack?
  discoveredTechs   Technology[]

  @@unique([provider, providerUsername])
}

model Technology {
  id             String           @id @default(uuid()) @db.Uuid
  name           String
  slug           String           @unique
  description    String?
  logoUrl        String?
  githubUrl      String
  githubStars    Int              @default(0)
  language       String?
  status         TechnologyStatus @default(pending)
  discoveredById String?          @db.Uuid
  createdAt      DateTime         @default(now())

  discoveredBy   User?            @relation(fields: [discoveredById], references: [id])
  stacks         StackTechnology[]
}

model Stack {
  id              String    @id @default(uuid()) @db.Uuid
  acronym         String    @unique // Case-insensitive uniqueness enforced via migration
  creatorId       String    @unique @db.Uuid // One stack per user
  questionnaire   Json      // { industries, notableFeature, competitor }
  description     String    // LLM-generated
  rerollsToday    Int       @default(0)
  lastRerollDate  DateTime  @default(now()) @db.Date
  createdAt       DateTime  @default(now())

  creator         User      @relation(fields: [creatorId], references: [id])
  technologies    StackTechnology[]
}

model StackTechnology {
  stackId       String @db.Uuid
  technologyId  String @db.Uuid
  position      Int

  stack         Stack      @relation(fields: [stackId], references: [id], onDelete: Cascade)
  technology    Technology @relation(fields: [technologyId], references: [id])

  @@id([stackId, technologyId])
}

model HallOfFame {
  id        String   @id @default(uuid()) @db.Uuid
  stackId   String   @db.Uuid
  pickedOn  DateTime @db.Date
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Run migration**

Run:
```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied. Prisma Client generated.

- [ ] **Step 5: Add case-insensitive index via raw SQL migration**

Run:
```bash
npx prisma migrate dev --name citext-acronym --create-only
```

Then edit the generated migration SQL file to add:
```sql
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE "Stack" ALTER COLUMN "acronym" TYPE citext;
```

Run:
```bash
npx prisma migrate dev
```

- [ ] **Step 6: Verify schema with Prisma Studio**

Run: `npx prisma studio`
Expected: All tables visible with correct columns and relations.

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts && git commit -m "feat: add Prisma schema with all models and CITEXT acronym"
```

---

### Task 3: Supabase Auth Setup

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/app/auth/callback/route.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create browser Supabase client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server Supabase client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create OAuth callback route**

Create `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const meta = data.user.user_metadata;
      const provider = data.user.app_metadata.provider ?? "github";
      const username = meta.user_name ?? meta.preferred_username;

      await prisma.user.upsert({
        where: { supabaseAuthId: data.user.id },
        update: {
          displayName: meta.full_name ?? username,
          avatarUrl: meta.avatar_url,
        },
        create: {
          supabaseAuthId: data.user.id,
          provider,
          providerUsername: username,
          displayName: meta.full_name ?? username,
          avatarUrl: meta.avatar_url,
          profileUrl: `https://github.com/${username}`,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

- [ ] **Step 4: Create middleware for session refresh**

Create `src/middleware.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Test auth flow manually**

Configure Supabase dashboard:
1. Enable GitHub OAuth provider with client ID/secret
2. Set redirect URL to `http://localhost:3000/auth/callback`

Create a temporary test button on the homepage that triggers:
```typescript
const supabase = createClient();
await supabase.auth.signInWithOAuth({
  provider: "github",
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

Expected: Clicking the button redirects to GitHub, then back to the app. User record created in database.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/ src/app/auth/ src/middleware.ts && git commit -m "feat: add Supabase auth with GitHub OAuth and user sync"
```

---

### Task 4: GitHub API Helpers

**Files:**
- Create: `src/lib/github.ts`
- Test: `src/lib/__tests__/github.test.ts`

- [ ] **Step 1: Write failing tests for GitHub helpers**

Create `src/lib/__tests__/github.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRepoInfo, fetchUserProfile } from "../github";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchRepoInfo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("extracts owner/repo from GitHub URL and returns repo data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: "react",
        description: "The library for web and native user interfaces.",
        owner: { avatar_url: "https://avatars.githubusercontent.com/u/69631?v=4" },
        stargazers_count: 225000,
        language: "JavaScript",
      }),
    });

    const result = await fetchRepoInfo("https://github.com/facebook/react");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/facebook/react",
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(result).toEqual({
      name: "react",
      description: "The library for web and native user interfaces.",
      logoUrl: "https://avatars.githubusercontent.com/u/69631?v=4",
      stars: 225000,
      language: "JavaScript",
    });
  });

  it("returns null for non-GitHub URLs", async () => {
    const result = await fetchRepoInfo("https://example.com/not-github");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("fetchUserProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches user profile data from GitHub API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        login: "mocha",
        name: "Mocha",
        bio: "I make things",
        location: "Internet",
        company: "Stacklist",
        avatar_url: "https://avatars.githubusercontent.com/u/123",
        public_repos: 42,
        followers: 100,
      }),
    });

    const result = await fetchUserProfile("mocha");

    expect(result).toMatchObject({
      login: "mocha",
      bio: "I make things",
      publicRepos: 42,
    });
  });
});
```

- [ ] **Step 2: Install Vitest and verify tests fail**

Run:
```bash
npm install -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement GitHub helpers**

Create `src/lib/github.ts`:
```typescript
const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function fetchRepoInfo(githubUrl: string) {
  const parsed = parseGitHubRepoUrl(githubUrl);
  if (!parsed) return null;

  const res = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`, {
    headers: githubHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    name: data.name as string,
    description: (data.description ?? "") as string,
    logoUrl: (data.owner?.avatar_url ?? "") as string,
    stars: data.stargazers_count as number,
    language: (data.language ?? "") as string,
  };
}

export async function fetchUserProfile(username: string) {
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: githubHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    login: data.login as string,
    name: (data.name ?? data.login) as string,
    bio: (data.bio ?? "") as string,
    location: (data.location ?? "") as string,
    company: (data.company ?? "") as string,
    avatarUrl: data.avatar_url as string,
    publicRepos: data.public_repos as number,
    followers: data.followers as number,
    following: data.following as number,
    htmlUrl: data.html_url as string,
  };
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/lib/__tests__/github.test.ts vitest.config.ts && git commit -m "feat: add GitHub API helpers for repo info and user profiles"
```

---

### Task 5: LLM Description Generation

**Files:**
- Create: `src/lib/llm.ts`
- Test: `src/lib/__tests__/llm.test.ts`

- [ ] **Step 1: Write failing tests for prompt building**

Create `src/lib/__tests__/llm.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildStackPrompt, buildRerollPrompt } from "../llm";

describe("buildStackPrompt", () => {
  it("builds a prompt with technologies and questionnaire answers", () => {
    const prompt = buildStackPrompt({
      technologies: [
        { name: "Bitcoin", description: "Decentralized digital currency" },
        { name: "Redis", description: "In-memory data store" },
      ],
      questionnaire: {
        industries: "Fintech, Memes",
        notableFeature: "Lightning-fast meme transactions",
        competitor: "The traditional banking system",
      },
    });

    expect(prompt).toContain("Bitcoin");
    expect(prompt).toContain("Decentralized digital currency");
    expect(prompt).toContain("Redis");
    expect(prompt).toContain("Fintech, Memes");
    expect(prompt).toContain("Lightning-fast meme transactions");
    expect(prompt).toContain("traditional banking system");
    expect(prompt).not.toContain("Some people mistake it for");
  });
});

describe("buildRerollPrompt", () => {
  it("includes the old description summary in the prompt", () => {
    const prompt = buildRerollPrompt({
      technologies: [
        { name: "Bitcoin", description: "Decentralized digital currency" },
      ],
      questionnaire: {
        industries: "Fintech",
        notableFeature: "Speed",
        competitor: "Banks",
      },
      oldDescriptionSummary: "a meme-powered banking platform",
    });

    expect(prompt).toContain(
      'Some people mistake it for a "a meme-powered banking platform"'
    );
    expect(prompt).toContain("totally different");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement prompt builders and generation function**

Create `src/lib/llm.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";

interface StackPromptInput {
  technologies: { name: string; description: string }[];
  questionnaire: {
    industries: string;
    notableFeature: string;
    competitor: string;
  };
}

interface RerollPromptInput extends StackPromptInput {
  oldDescriptionSummary: string;
}

export function buildStackPrompt(input: StackPromptInput): string {
  const techList = input.technologies
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  return `You are a very silly software engineer that has built a software framework relying on ${input.technologies.map((t) => t.name).join(", ")}. They do the following:

${techList}

Here's what you know about this stack:
- Industries that primarily use it: ${input.questionnaire.industries}
- Its most notable feature: ${input.questionnaire.notableFeature}
- Its biggest competitor: ${input.questionnaire.competitor}

Another developer is asking you for a concise description of what your 'stack' is and how it works. Explain to them in simple terms what it does, and what each technology is contributing to it.

Don't worry about it making too much sense functionally, but focus instead on making sure that every individual technology is being highlighted in some way.`;
}

export function buildRerollPrompt(input: RerollPromptInput): string {
  const base = buildStackPrompt(input);
  return `${base}

Some people mistake it for a "${input.oldDescriptionSummary}" but this is _totally_ different.`;
}

export async function generateDescription(prompt: string): Promise<string> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

export async function summarizeDescription(
  description: string
): Promise<string> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Summarize this stack description in one short sentence (under 15 words), keeping the tone:\n\n${description}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: All tests PASS (prompt builder tests don't hit the API).

- [ ] **Step 5: Commit**

```bash
git add src/lib/llm.ts src/lib/__tests__/llm.test.ts && git commit -m "feat: add LLM prompt builders and description generation"
```

---

### Task 6: Technologies API

**Files:**
- Create: `src/app/api/technologies/route.ts`

- [ ] **Step 1: Write the technologies search endpoint**

Create `src/app/api/technologies/route.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const technologies = await prisma.technology.findMany({
    where: {
      status: "approved",
      ...(query
        ? { name: { contains: query, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      githubStars: true,
    },
    take: 20,
  });

  return NextResponse.json(technologies);
}
```

- [ ] **Step 2: Test manually with curl**

Run: `curl http://localhost:3000/api/technologies?q=react`
Expected: JSON array (empty if no seed data yet, but 200 OK).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/technologies/ && git commit -m "feat: add technologies search API endpoint"
```

---

### Task 7: Technology Suggestion API

**Files:**
- Create: `src/app/api/technologies/suggest/route.ts`
- Create: `src/lib/moderation.ts`

- [ ] **Step 1: Write the moderation helper**

Create `src/lib/moderation.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";

export async function vibeCheckUrl(
  name: string,
  url: string
): Promise<{ ok: boolean; reason: string }> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `A user is suggesting a technology called "${name}" with the URL "${url}" for inclusion in a developer tools directory.

Does this appear to be a legitimate software project/technology? Is there anything inappropriate, offensive, or concerning about the name or URL?

Respond with JSON: { "ok": true/false, "reason": "brief explanation" }`,
      },
    ],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, reason: "Could not parse moderation response" };
  }
}
```

- [ ] **Step 2: Write the suggestion endpoint**

Create `src/app/api/technologies/suggest/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchRepoInfo } from "@/lib/github";
import { vibeCheckUrl } from "@/lib/moderation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, githubUrl } = body;

  if (!name || !githubUrl) {
    return NextResponse.json(
      { error: "Name and GitHub URL are required" },
      { status: 400 }
    );
  }

  // Check if technology already exists
  const existing = await prisma.technology.findFirst({
    where: { githubUrl },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This technology has already been suggested", technology: existing },
      { status: 409 }
    );
  }

  // Fetch repo info from GitHub
  const repoInfo = await fetchRepoInfo(githubUrl);
  if (!repoInfo) {
    return NextResponse.json(
      { error: "Could not fetch repository info. Is the URL correct?" },
      { status: 400 }
    );
  }

  // Haiku vibe check
  const vibeCheck = await vibeCheckUrl(name, githubUrl);

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Disambiguate slug if needed
  let finalSlug = slug;
  let counter = 1;
  while (await prisma.technology.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const technology = await prisma.technology.create({
    data: {
      name,
      slug: finalSlug,
      description: repoInfo.description,
      logoUrl: repoInfo.logoUrl,
      githubUrl,
      githubStars: repoInfo.stars,
      language: repoInfo.language,
      status: vibeCheck.ok ? "pending" : "rejected",
      discoveredById: dbUser.id,
    },
  });

  return NextResponse.json({
    technology,
    moderation: vibeCheck,
    message: vibeCheck.ok
      ? "Technology suggested! It will be reviewed before appearing in the picker."
      : `Suggestion rejected: ${vibeCheck.reason}`,
  }, { status: 201 });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/moderation.ts src/app/api/technologies/suggest/ && git commit -m "feat: add technology suggestion API with Haiku moderation"
```

---

### Task 8: Acronym Uniqueness Check API

**Files:**
- Create: `src/app/api/stacks/check/route.ts`

- [ ] **Step 1: Write the uniqueness check endpoint**

Create `src/app/api/stacks/check/route.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const acronym = searchParams.get("acronym");

  if (!acronym) {
    return NextResponse.json(
      { error: "acronym parameter is required" },
      { status: 400 }
    );
  }

  // CITEXT column handles case-insensitive comparison
  const existing = await prisma.stack.findUnique({
    where: { acronym },
    select: {
      acronym: true,
      creator: {
        select: { providerUsername: true },
      },
    },
  });

  return NextResponse.json({
    available: !existing,
    ...(existing && {
      existingStack: {
        acronym: existing.acronym,
        creator: existing.creator.providerUsername,
      },
    }),
  });
}
```

- [ ] **Step 2: Test manually**

Run: `curl "http://localhost:3000/api/stacks/check?acronym=LAMP"`
Expected: `{ "available": true }` (no stacks seeded yet).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stacks/check/ && git commit -m "feat: add acronym uniqueness check API"
```

---

### Task 9: Stack Creation API

**Files:**
- Create: `src/app/api/stacks/route.ts`

- [ ] **Step 1: Write the stack creation endpoint**

Create `src/app/api/stacks/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { buildStackPrompt, generateDescription } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (dbUser.hasStack) {
    return NextResponse.json(
      { error: "You've already invented your stack. This is your one shot." },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { acronym, technologyIds, questionnaire } = body as {
    acronym: string;
    technologyIds: string[];
    questionnaire: {
      industries: string;
      notableFeature: string;
      competitor: string;
    };
  };

  if (!acronym || !technologyIds?.length || technologyIds.length < 2) {
    return NextResponse.json(
      { error: "Acronym and at least 2 technologies are required" },
      { status: 400 }
    );
  }

  if (!questionnaire?.industries || !questionnaire?.notableFeature || !questionnaire?.competitor) {
    return NextResponse.json(
      { error: "All three questionnaire answers are required" },
      { status: 400 }
    );
  }

  // Verify acronym length matches tech count
  if (acronym.length !== technologyIds.length) {
    return NextResponse.json(
      { error: "Acronym length must match number of technologies" },
      { status: 400 }
    );
  }

  // Check uniqueness (CITEXT handles case-insensitivity)
  const existing = await prisma.stack.findUnique({ where: { acronym } });
  if (existing) {
    return NextResponse.json(
      { error: "This acronym has already been claimed" },
      { status: 409 }
    );
  }

  // Fetch technology details for prompt
  const technologies = await prisma.technology.findMany({
    where: {
      id: { in: technologyIds },
      status: "approved",
    },
    select: { id: true, name: true, description: true },
  });

  if (technologies.length !== technologyIds.length) {
    return NextResponse.json(
      { error: "One or more technologies not found or not approved" },
      { status: 400 }
    );
  }

  // Verify first letters match acronym
  const orderedTechs = technologyIds.map((id) =>
    technologies.find((t) => t.id === id)!
  );
  const builtAcronym = orderedTechs
    .map((t) => t.name[0].toUpperCase())
    .join("");
  if (builtAcronym.toUpperCase() !== acronym.toUpperCase()) {
    return NextResponse.json(
      {
        error: `Technologies spell "${builtAcronym}", not "${acronym}"`,
      },
      { status: 400 }
    );
  }

  // Generate LLM description
  const prompt = buildStackPrompt({
    technologies: orderedTechs.map((t) => ({
      name: t.name,
      description: t.description ?? "",
    })),
    questionnaire,
  });
  const description = await generateDescription(prompt);

  // Create stack in a transaction
  const stack = await prisma.$transaction(async (tx) => {
    const newStack = await tx.stack.create({
      data: {
        acronym,
        creatorId: dbUser.id,
        questionnaire,
        description,
      },
    });

    await tx.stackTechnology.createMany({
      data: technologyIds.map((techId, index) => ({
        stackId: newStack.id,
        technologyId: techId,
        position: index,
      })),
    });

    await tx.user.update({
      where: { id: dbUser.id },
      data: { hasStack: true },
    });

    return newStack;
  });

  return NextResponse.json({ stack, redirect: `/s/${stack.acronym}` }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stacks/route.ts && git commit -m "feat: add stack creation API with LLM description generation"
```

---

### Task 10: Reroll Description API

**Files:**
- Create: `src/app/api/stacks/[acronym]/reroll/route.ts`

- [ ] **Step 1: Write the reroll endpoint**

Create `src/app/api/stacks/[acronym]/reroll/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  buildRerollPrompt,
  generateDescription,
  summarizeDescription,
} from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ acronym: string }> }
) {
  const { acronym } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  const stack = await prisma.stack.findUnique({
    where: { acronym },
    include: {
      technologies: {
        include: { technology: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  if (stack.creatorId !== dbUser?.id) {
    return NextResponse.json(
      { error: "Only the inventor can reroll" },
      { status: 403 }
    );
  }

  // Check reroll limit (lazy reset)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReroll = new Date(stack.lastRerollDate);
  lastReroll.setHours(0, 0, 0, 0);

  let rerollsUsed = stack.rerollsToday;
  if (lastReroll < today) {
    rerollsUsed = 0; // New day, reset counter
  }

  if (rerollsUsed >= 2) {
    return NextResponse.json(
      { error: "You've used both rerolls for today. Try again tomorrow." },
      { status: 429 }
    );
  }

  // Summarize old description for the reroll prompt
  const oldSummary = await summarizeDescription(stack.description);

  const questionnaire = stack.questionnaire as {
    industries: string;
    notableFeature: string;
    competitor: string;
  };

  const prompt = buildRerollPrompt({
    technologies: stack.technologies.map((st) => ({
      name: st.technology.name,
      description: st.technology.description ?? "",
    })),
    questionnaire,
    oldDescriptionSummary: oldSummary,
  });

  const newDescription = await generateDescription(prompt);

  await prisma.stack.update({
    where: { id: stack.id },
    data: {
      description: newDescription,
      rerollsToday: rerollsUsed + 1,
      lastRerollDate: today,
    },
  });

  return NextResponse.json({
    description: newDescription,
    rerollsRemaining: 1 - rerollsUsed,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stacks/\[acronym\]/reroll/ && git commit -m "feat: add reroll description API with daily limit"
```

---

### Task 11: Relinquish Stack API

**Files:**
- Create: `src/app/api/stacks/[acronym]/route.ts`

- [ ] **Step 1: Write the relinquish endpoint**

Create `src/app/api/stacks/[acronym]/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ acronym: string }> }
) {
  const { acronym } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  const stack = await prisma.stack.findUnique({
    where: { acronym },
  });

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  if (stack.creatorId !== dbUser?.id) {
    return NextResponse.json(
      { error: "Only the inventor can relinquish their stack" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));

  if (body.confirmation !== "Yeah it sucks these days anyway") {
    return NextResponse.json(
      { error: "Invalid confirmation", expected: "Yeah it sucks these days anyway" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.stack.delete({ where: { id: stack.id } }),
    prisma.user.update({
      where: { id: dbUser!.id },
      data: { hasStack: false },
    }),
  ]);

  return NextResponse.json({ message: "Stack relinquished. The acronym is free." });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stacks/\[acronym\]/route.ts && git commit -m "feat: add relinquish stack API with confirmation"
```

---

### Task 12: User Profile Sync API

**Files:**
- Create: `src/app/api/users/[username]/sync/route.ts`

- [ ] **Step 1: Write the sync endpoint**

Create `src/app/api/users/[username]/sync/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchUserProfile } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser || dbUser.providerUsername !== username) {
    return NextResponse.json(
      { error: "You can only sync your own profile" },
      { status: 403 }
    );
  }

  const profileData = await fetchUserProfile(username);
  if (!profileData) {
    return NextResponse.json(
      { error: "Could not fetch GitHub profile" },
      { status: 502 }
    );
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      displayName: profileData.name,
      avatarUrl: profileData.avatarUrl,
      githubData: profileData as object,
      githubDataSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ profile: profileData });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/users/ && git commit -m "feat: add user profile sync API"
```

---

### Task 13: Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the seed script**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create the @mocha placeholder user
  const mocha = await prisma.user.upsert({
    where: {
      provider_providerUsername: {
        provider: "github",
        providerUsername: "mocha",
      },
    },
    update: {},
    create: {
      provider: "github",
      providerUsername: "mocha",
      displayName: "mocha",
      profileUrl: "https://github.com/mocha",
      supabaseAuthId: "seed-mocha-placeholder",
    },
  });

  // Seed technologies (discoveredBy @mocha as placeholder)
  const techData = [
    { name: "Linux", slug: "linux", githubUrl: "https://github.com/torvalds/linux", language: "C" },
    { name: "Apache", slug: "apache", githubUrl: "https://github.com/apache/httpd", language: "C" },
    { name: "MySQL", slug: "mysql", githubUrl: "https://github.com/mysql/mysql-server", language: "C++" },
    { name: "PHP", slug: "php", githubUrl: "https://github.com/php/php-src", language: "C" },
    { name: "MongoDB", slug: "mongodb", githubUrl: "https://github.com/mongodb/mongo", language: "C++" },
    { name: "Express", slug: "express", githubUrl: "https://github.com/expressjs/express", language: "JavaScript" },
    { name: "Angular", slug: "angular", githubUrl: "https://github.com/angular/angular", language: "TypeScript" },
    { name: "Node.js", slug: "nodejs", githubUrl: "https://github.com/nodejs/node", language: "JavaScript" },
    { name: "React", slug: "react", githubUrl: "https://github.com/facebook/react", language: "JavaScript" },
    { name: "Elasticsearch", slug: "elasticsearch", githubUrl: "https://github.com/elastic/elasticsearch", language: "Java" },
    { name: "Logstash", slug: "logstash", githubUrl: "https://github.com/elastic/logstash", language: "Ruby" },
    { name: "Kibana", slug: "kibana", githubUrl: "https://github.com/elastic/kibana", language: "TypeScript" },
    { name: "Vue.js", slug: "vuejs", githubUrl: "https://github.com/vuejs/core", language: "TypeScript" },
    { name: "JavaScript", slug: "javascript", githubUrl: "https://github.com/nicolo-ribaudo/tc39-proposal-ecma-262", language: "JavaScript" },
    { name: "PostgreSQL", slug: "postgresql", githubUrl: "https://github.com/postgres/postgres", language: "C" },
  ];

  const techs: Record<string, string> = {};

  for (const t of techData) {
    const tech = await prisma.technology.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        name: t.name,
        slug: t.slug,
        githubUrl: t.githubUrl,
        language: t.language,
        status: "approved",
        discoveredById: mocha.id,
      },
    });
    techs[t.name] = tech.id;
  }

  // Seed one canonical stack under @mocha
  // Other canonical stacks (MEAN, MERN, ELK, etc.) will be added later
  // once the deep research prompt identifies their real inventors,
  // who will each get their own user records.
  const existingLamp = await prisma.stack.findUnique({ where: { acronym: "LAMP" } });
  if (!existingLamp) {
    const lamp = await prisma.stack.create({
      data: {
        acronym: "LAMP",
        creatorId: mocha.id,
        questionnaire: {
          industries: "Web hosting, enterprise web applications",
          notableFeature: "The OG open-source web stack",
          competitor: "Microsoft's IIS + SQL Server stack",
        },
        description:
          "[Placeholder — regenerate with LLM] The LAMP stack uses Linux, Apache, MySQL, and PHP.",
      },
    });

    await prisma.user.update({
      where: { id: mocha.id },
      data: { hasStack: true },
    });

    const lampTechs = ["Linux", "Apache", "MySQL", "PHP"];
    for (let i = 0; i < lampTechs.length; i++) {
      const techId = techs[lampTechs[i]];
      if (techId) {
        await prisma.stackTechnology.create({
          data: { stackId: lamp.id, technologyId: techId, position: i },
        });
      }
    }
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

- [ ] **Step 2: Add seed command to package.json**

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Run the seed**

Run: `npx prisma db seed`
Expected: "Seed complete!" — technologies and LAMP stack created.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json && git commit -m "feat: add seed script with technologies and LAMP canonical stack"
```

---

### Task 14: Admin CLI Tool

**Files:**
- Create: `cli/admin.ts`

- [ ] **Step 1: Write the admin CLI**

Create `cli/admin.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listPending() {
  const pending = await prisma.technology.findMany({
    where: { status: "pending" },
    include: { discoveredBy: { select: { providerUsername: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (pending.length === 0) {
    console.log("No pending technology suggestions.");
    return;
  }

  console.log(`\n${pending.length} pending suggestion(s):\n`);
  for (const tech of pending) {
    console.log(`  [${tech.id}]`);
    console.log(`    Name:        ${tech.name}`);
    console.log(`    URL:         ${tech.githubUrl}`);
    console.log(`    Language:    ${tech.language ?? "unknown"}`);
    console.log(`    Stars:       ${tech.githubStars}`);
    console.log(`    Suggested by: @${tech.discoveredBy?.providerUsername ?? "unknown"}`);
    console.log(`    Date:        ${tech.createdAt.toISOString()}`);
    console.log();
  }
}

async function approve(id: string) {
  const tech = await prisma.technology.update({
    where: { id },
    data: { status: "approved" },
  });
  console.log(`Approved: ${tech.name} (${tech.slug})`);
}

async function reject(id: string) {
  const tech = await prisma.technology.update({
    where: { id },
    data: { status: "rejected" },
  });
  console.log(`Rejected: ${tech.name}`);
}

async function main() {
  const [command, arg] = process.argv.slice(2);

  switch (command) {
    case "list":
      await listPending();
      break;
    case "approve":
      if (!arg) {
        console.error("Usage: admin approve <technology-id>");
        process.exit(1);
      }
      await approve(arg);
      break;
    case "reject":
      if (!arg) {
        console.error("Usage: admin reject <technology-id>");
        process.exit(1);
      }
      await reject(arg);
      break;
    default:
      console.log("Stacklist Admin CLI");
      console.log("  list              — show pending technology suggestions");
      console.log("  approve <id>      — approve a technology");
      console.log("  reject <id>       — reject a technology");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add CLI script to package.json**

Add to `package.json` scripts:
```json
"admin": "tsx cli/admin.ts"
```

- [ ] **Step 3: Test the CLI**

Run: `npm run admin list`
Expected: "No pending technology suggestions."

- [ ] **Step 4: Commit**

```bash
git add cli/ package.json && git commit -m "feat: add admin CLI for technology approval"
```

---

### Task 15: Background Jobs — GitHub Stars Refresh

**Files:**
- Create: `src/app/api/cron/refresh-stars/route.ts`

- [ ] **Step 1: Write the stars refresh cron endpoint**

Create `src/app/api/cron/refresh-stars/route.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { fetchRepoInfo } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const technologies = await prisma.technology.findMany({
    where: { status: "approved" },
    select: { id: true, githubUrl: true },
  });

  let updated = 0;
  for (const tech of technologies) {
    const info = await fetchRepoInfo(tech.githubUrl);
    if (info) {
      await prisma.technology.update({
        where: { id: tech.id },
        data: { githubStars: info.stars },
      });
      updated++;
    }
  }

  return NextResponse.json({ updated, total: technologies.length });
}
```

- [ ] **Step 2: Add CRON_SECRET to env template**

Add to `.env.local.example`:
```env
# Cron job authentication
CRON_SECRET=your-cron-secret
```

- [ ] **Step 3: Create Vercel cron config**

Add to `vercel.json` (create if needed):
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-stars",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/ vercel.json .env.local.example && git commit -m "feat: add daily GitHub stars refresh cron job"
```

---

### Task 16: Background Jobs — Hall of Fame Refresh

**Files:**
- Create: `src/app/api/cron/refresh-hall-of-fame/route.ts`

- [ ] **Step 1: Write the Hall of Fame refresh endpoint**

Create `src/app/api/cron/refresh-hall-of-fame/route.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clear old entries
  await prisma.hallOfFame.deleteMany({
    where: { pickedOn: { lt: today } },
  });

  // Check if today's picks already exist
  const existing = await prisma.hallOfFame.count({
    where: { pickedOn: today },
  });

  if (existing >= 5) {
    return NextResponse.json({ message: "Already picked for today", count: existing });
  }

  // Pick 5 random stacks using Postgres random ordering
  const randomStacks = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Stack" ORDER BY RANDOM() LIMIT 5
  `;

  for (const stack of randomStacks) {
    await prisma.hallOfFame.create({
      data: {
        stackId: stack.id,
        pickedOn: today,
      },
    });
  }

  return NextResponse.json({ message: "Hall of Fame refreshed", count: randomStacks.length });
}
```

- [ ] **Step 2: Add to Vercel cron config**

Update `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-stars",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/refresh-hall-of-fame",
      "schedule": "0 0 * * *"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/refresh-hall-of-fame/ vercel.json && git commit -m "feat: add daily Hall of Fame random selection cron"
```

---

### Task 17: Homepage (Server Component)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the homepage with data fetching**

Replace `src/app/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getHallOfFame() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = await prisma.hallOfFame.findMany({
    where: { pickedOn: today },
    include: {
      // HallOfFame doesn't have a relation to Stack in schema — fix needed.
      // For now, fetch stack IDs and query separately.
    },
  });

  if (entries.length === 0) {
    // Fallback: pick 5 random stacks inline
    return prisma.$queryRaw<
      { id: string; acronym: string; createdAt: Date }[]
    >`SELECT id, acronym, "createdAt" FROM "Stack" ORDER BY RANDOM() LIMIT 5`;
  }

  const stackIds = entries.map((e) => e.stackId);
  return prisma.stack.findMany({
    where: { id: { in: stackIds } },
    include: {
      creator: { select: { providerUsername: true, avatarUrl: true } },
      technologies: {
        include: { technology: { select: { name: true, githubStars: true } } },
        orderBy: { position: "asc" },
      },
    },
  });
}

async function getRecentStacks() {
  return prisma.stack.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      creator: { select: { providerUsername: true, avatarUrl: true } },
      technologies: {
        include: { technology: { select: { name: true, githubStars: true } } },
        orderBy: { position: "asc" },
      },
    },
  });
}

export default async function HomePage() {
  const [hallOfFame, recentStacks] = await Promise.all([
    getHallOfFame(),
    getRecentStacks(),
  ]);

  return (
    <main>
      {/* Hero section with "Design my Stack" CTA */}
      <section>
        <h1>Stacklist</h1>
        <p>Claim your stack. There can be only one.</p>
        <Link href="/build">Design my Stack</Link>
      </section>

      <div>
        {/* Hall of Fame column */}
        <section>
          <h2>Hall of Fame</h2>
          {Array.isArray(hallOfFame) &&
            hallOfFame.map((stack: any) => (
              <Link key={stack.id ?? stack.acronym} href={`/s/${stack.acronym}`}>
                <div>
                  <span>The {stack.acronym} Stack</span>
                  {stack.creator && (
                    <span>by @{stack.creator.providerUsername}</span>
                  )}
                </div>
              </Link>
            ))}
        </section>

        {/* Just Invented column */}
        <section>
          <h2>Just Invented</h2>
          {recentStacks.map((stack) => {
            const totalStars = stack.technologies.reduce(
              (sum, st) => sum + st.technology.githubStars,
              0
            );
            return (
              <Link key={stack.id} href={`/s/${stack.acronym}`}>
                <div>
                  <span>The {stack.acronym} Stack</span>
                  <span>by @{stack.creator.providerUsername}</span>
                  <span>{totalStars.toLocaleString()} stars</span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add HallOfFame → Stack relation to Prisma schema**

Add to `prisma/schema.prisma` in the `HallOfFame` model:
```prisma
model HallOfFame {
  id        String   @id @default(uuid()) @db.Uuid
  stackId   String   @db.Uuid
  pickedOn  DateTime @db.Date

  stack     Stack    @relation(fields: [stackId], references: [id], onDelete: Cascade)
}
```

And add to the `Stack` model:
```prisma
  hallOfFame      HallOfFame[]
```

Run: `npx prisma migrate dev --name hall-of-fame-relation`

- [ ] **Step 3: Verify homepage renders**

Run: `npm run dev` and visit `http://localhost:3000`
Expected: Page renders with empty or seeded data. No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx prisma/ && git commit -m "feat: add homepage with Hall of Fame and recent stacks"
```

---

### Task 18: Stack Detail Page

**Files:**
- Create: `src/app/s/[acronym]/page.tsx`

- [ ] **Step 1: Build the stack detail page**

Create `src/app/s/[acronym]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ acronym: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { acronym } = await params;
  const stack = await prisma.stack.findUnique({
    where: { acronym },
    select: { acronym: true, description: true },
  });

  if (!stack) {
    return { title: `Claim the ${acronym.toUpperCase()} Stack — Stacklist` };
  }

  return {
    title: `The ${stack.acronym} Stack — Stacklist`,
    description: stack.description.slice(0, 160),
  };
}

export default async function StackDetailPage({ params }: Props) {
  const { acronym } = await params;

  const stack = await prisma.stack.findUnique({
    where: { acronym },
    include: {
      creator: {
        select: {
          id: true,
          providerUsername: true,
          avatarUrl: true,
          profileUrl: true,
          supabaseAuthId: true,
        },
      },
      technologies: {
        include: {
          technology: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              githubStars: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  // Unclaimed acronym — show CTA
  if (!stack) {
    return (
      <main>
        <h1>The {acronym.toUpperCase()} Stack</h1>
        <p>Nobody has claimed this one yet.</p>
        <Link href="/build">Invent it yourself</Link>
      </main>
    );
  }

  const totalStars = stack.technologies.reduce(
    (sum, st) => sum + st.technology.githubStars,
    0
  );

  // Check if current user is the creator
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCreator = user?.id === stack.creator.supabaseAuthId;

  // Reroll availability (lazy reset check)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReroll = new Date(stack.lastRerollDate);
  lastReroll.setHours(0, 0, 0, 0);
  const rerollsUsed = lastReroll < today ? 0 : stack.rerollsToday;
  const canReroll = isCreator && rerollsUsed < 2;

  return (
    <main>
      <h1>The {stack.acronym} Stack</h1>

      <div>
        <Link href={stack.creator.profileUrl}>
          {stack.creator.avatarUrl && (
            <img
              src={stack.creator.avatarUrl}
              alt={stack.creator.providerUsername}
              width={32}
              height={32}
            />
          )}
          Invented by @{stack.creator.providerUsername}
        </Link>
        <time dateTime={stack.createdAt.toISOString()}>
          {stack.createdAt.toLocaleDateString()}
        </time>
      </div>

      <div>
        <span>{totalStars.toLocaleString()} stars</span>
      </div>

      <ul>
        {stack.technologies.map((st) => (
          <li key={st.technologyId}>
            <Link href={`/t/${st.technology.slug}`}>
              {st.technology.logoUrl && (
                <img
                  src={st.technology.logoUrl}
                  alt={st.technology.name}
                  width={24}
                  height={24}
                />
              )}
              {st.technology.name}
            </Link>
          </li>
        ))}
      </ul>

      <div>
        <p>{stack.description}</p>
      </div>

      {isCreator && (
        <div>
          {canReroll && (
            <button data-action="reroll">
              Reroll Description ({2 - rerollsUsed} left today)
            </button>
          )}
          <button data-action="relinquish">Relinquish</button>
        </div>
      )}

      {/* Ad placeholder for future use */}
      {/* <div className="ad-slot" data-ad-size="300x250" /> */}
    </main>
  );
}
```

- [ ] **Step 2: Verify with dev server**

Run: `npm run dev` and visit `http://localhost:3000/s/LAMP`
Expected: Stack detail page renders (or CTA page if not seeded). Visit `/s/DOESNOTEXIST` to see the unclaimed CTA.

- [ ] **Step 3: Commit**

```bash
git add src/app/s/ && git commit -m "feat: add stack detail page with creator actions"
```

---

### Task 19: Technology Detail Page

**Files:**
- Create: `src/app/t/[slug]/page.tsx`

- [ ] **Step 1: Build the technology detail page**

Create `src/app/t/[slug]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tech = await prisma.technology.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!tech) return { title: "Technology Not Found — Stacklist" };

  return {
    title: `${tech.name} — Stacklist`,
    description: tech.description?.slice(0, 160) ?? `Learn about ${tech.name}`,
  };
}

export default async function TechnologyPage({ params }: Props) {
  const { slug } = await params;

  const technology = await prisma.technology.findUnique({
    where: { slug },
    include: {
      discoveredBy: {
        select: { providerUsername: true, profileUrl: true },
      },
      stacks: {
        include: {
          stack: {
            select: {
              acronym: true,
              creator: { select: { providerUsername: true } },
            },
          },
        },
      },
    },
  });

  if (!technology || technology.status !== "approved") {
    notFound();
  }

  return (
    <main>
      <div>
        {technology.logoUrl && (
          <img
            src={technology.logoUrl}
            alt={technology.name}
            width={64}
            height={64}
          />
        )}
        <h1>{technology.name}</h1>
      </div>

      {technology.description && <p>{technology.description}</p>}

      <dl>
        {technology.language && (
          <>
            <dt>Language</dt>
            <dd>{technology.language}</dd>
          </>
        )}
        <dt>GitHub Stars</dt>
        <dd>{technology.githubStars.toLocaleString()}</dd>
        <dt>GitHub</dt>
        <dd>
          <a href={technology.githubUrl} target="_blank" rel="noopener noreferrer">
            {technology.githubUrl}
          </a>
        </dd>
        {technology.discoveredBy && (
          <>
            <dt>Discovered by</dt>
            <dd>
              <a href={technology.discoveredBy.profileUrl}>
                @{technology.discoveredBy.providerUsername}
              </a>
            </dd>
          </>
        )}
      </dl>

      {technology.stacks.length > 0 && (
        <section>
          <h2>Used in these stacks</h2>
          <ul>
            {technology.stacks.map((st) => (
              <li key={st.stack.acronym}>
                <Link href={`/s/${st.stack.acronym}`}>
                  The {st.stack.acronym} Stack
                </Link>
                <span> by @{st.stack.creator.providerUsername}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/t/ && git commit -m "feat: add technology detail page"
```

---

### Task 20: User Profile Page

**Files:**
- Create: `src/app/u/[username]/page.tsx`

- [ ] **Step 1: Build the user profile page**

Create `src/app/u/[username]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} — Stacklist` };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const dbUser = await prisma.user.findFirst({
    where: { providerUsername: username },
    include: {
      stack: {
        select: { acronym: true },
      },
    },
  });

  if (!dbUser) {
    notFound();
  }

  const githubData = dbUser.githubData as {
    bio?: string;
    location?: string;
    company?: string;
    publicRepos?: number;
    followers?: number;
    following?: number;
    htmlUrl?: string;
  } | null;

  // Check if current user is the profile owner
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === dbUser.supabaseAuthId;

  return (
    <main>
      <div>
        {dbUser.avatarUrl && (
          <img
            src={dbUser.avatarUrl}
            alt={dbUser.providerUsername}
            width={128}
            height={128}
          />
        )}
        <h1>{dbUser.displayName}</h1>
        <p>@{dbUser.providerUsername}</p>
      </div>

      {githubData?.bio && <p>{githubData.bio}</p>}

      <dl>
        {githubData?.location && (
          <>
            <dt>Location</dt>
            <dd>{githubData.location}</dd>
          </>
        )}
        {githubData?.company && (
          <>
            <dt>Company</dt>
            <dd>{githubData.company}</dd>
          </>
        )}
        {githubData?.publicRepos != null && (
          <>
            <dt>Public Repos</dt>
            <dd>{githubData.publicRepos}</dd>
          </>
        )}
        {githubData?.followers != null && (
          <>
            <dt>Followers</dt>
            <dd>{githubData.followers.toLocaleString()}</dd>
          </>
        )}
      </dl>

      {dbUser.stack ? (
        <section>
          <h2>
            Inventor of{" "}
            <Link href={`/s/${dbUser.stack.acronym}`}>
              the {dbUser.stack.acronym} Stack
            </Link>
          </h2>
        </section>
      ) : (
        <section>
          <p>Hasn&apos;t invented a stack yet.</p>
        </section>
      )}

      <div>
        <a
          href={dbUser.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
        {isOwner && (
          <button data-action="sync">Sync GitHub Data</button>
        )}
      </div>

      {dbUser.githubDataSyncedAt && (
        <p>
          Last synced: {dbUser.githubDataSyncedAt.toLocaleDateString()}
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/u/ && git commit -m "feat: add user profile page with GitHub data"
```

---

### Task 21: Stack Builder Page

**Files:**
- Create: `src/app/build/page.tsx`

This is the most interactive page — the typeahead-driven stack builder. It's a client component with significant interactivity. The visual design will be handled later by frontend-design; this task wires up the functionality.

- [ ] **Step 1: Build the stack builder page**

Create `src/app/build/page.tsx`:
```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Technology {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  githubStars: number;
}

interface TechEntry {
  query: string;
  selected: Technology | null;
  isUnknown: boolean;
}

interface UniquenessResult {
  available: boolean;
  existingStack?: { acronym: string; creator: string };
}

export default function BuildPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TechEntry[]>([
    { query: "", selected: null, isUnknown: false },
  ]);
  const [suggestions, setSuggestions] = useState<Technology[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [uniqueness, setUniqueness] = useState<UniquenessResult | null>(null);
  const [questionnaire, setQuestionnaire] = useState({
    industries: "",
    notableFeature: "",
    competitor: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build acronym from selected technologies
  const acronym = entries
    .filter((e) => e.selected || e.isUnknown)
    .map((e) => {
      const name = e.selected?.name ?? e.query;
      return name[0]?.toUpperCase() ?? "";
    })
    .join("");

  // Check acronym uniqueness (debounced)
  useEffect(() => {
    if (acronym.length < 2) {
      setUniqueness(null);
      return;
    }

    const timeout = setTimeout(async () => {
      const res = await fetch(
        `/api/stacks/check?acronym=${encodeURIComponent(acronym)}`
      );
      const data = await res.json();
      setUniqueness(data);
    }, 300);

    return () => clearTimeout(timeout);
  }, [acronym]);

  // Search technologies as user types
  const searchTechnologies = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `/api/technologies?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setSuggestions(data);
  }, []);

  const updateEntry = (index: number, query: string) => {
    const newEntries = [...entries];
    newEntries[index] = { query, selected: null, isUnknown: false };
    setEntries(newEntries);
    setActiveLine(index);
    searchTechnologies(query);
  };

  const selectTechnology = (index: number, tech: Technology) => {
    const newEntries = [...entries];
    newEntries[index] = { query: tech.name, selected: tech, isUnknown: false };
    setEntries(newEntries);
    setSuggestions([]);
  };

  const addLine = () => {
    setEntries([...entries, { query: "", selected: null, isUnknown: false }]);
    setActiveLine(entries.length);
  };

  const removeLine = (index: number) => {
    if (entries.length <= 1) return;
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "+") {
      e.preventDefault();

      // If query doesn't match any suggestion, mark as unknown
      const entry = entries[index];
      if (entry.query && !entry.selected) {
        const newEntries = [...entries];
        newEntries[index] = { ...entry, isUnknown: true };
        setEntries(newEntries);
      }

      addLine();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    // Check for unknown technologies that need suggestion
    const unknowns = entries.filter((e) => e.isUnknown);
    if (unknowns.length > 0) {
      // TODO: Show suggestion modal for unknown techs
      // For now, block save
      setError(
        `Unknown technologies: ${unknowns.map((e) => e.query).join(", ")}. Please select from the list or suggest them first.`
      );
      setSaving(false);
      return;
    }

    const technologyIds = entries
      .filter((e) => e.selected)
      .map((e) => e.selected!.id);

    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acronym, technologyIds, questionnaire }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSaving(false);
        return;
      }

      router.push(data.redirect);
    } catch {
      setError("Something went wrong. Try again.");
      setSaving(false);
    }
  };

  const canSave =
    acronym.length >= 2 &&
    uniqueness?.available &&
    entries.every((e) => e.selected) &&
    questionnaire.industries &&
    questionnaire.notableFeature &&
    questionnaire.competitor;

  return (
    <main>
      <h1>
        {acronym ? `The ${acronym} Stack!` : "Design my Stack"}
      </h1>

      {uniqueness && (
        <div>
          {uniqueness.available ? (
            <span>Available!</span>
          ) : (
            <span>
              Taken by{" "}
              <a href={`/s/${uniqueness.existingStack?.acronym}`}>
                @{uniqueness.existingStack?.creator}
              </a>
            </span>
          )}
        </div>
      )}

      <div>
        {entries.map((entry, index) => (
          <div key={index}>
            <input
              type="text"
              value={entry.query}
              onChange={(e) => updateEntry(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => setActiveLine(index)}
              placeholder="Type a technology name..."
              autoFocus={index === activeLine}
            />
            {entry.selected && <span>{entry.selected.name[0]}</span>}
            {entries.length > 1 && (
              <button onClick={() => removeLine(index)}>x</button>
            )}

            {/* Typeahead dropdown */}
            {activeLine === index && suggestions.length > 0 && (
              <ul>
                {suggestions.map((tech) => (
                  <li key={tech.id}>
                    <button onClick={() => selectTechnology(index, tech)}>
                      {tech.name}
                      {tech.description && (
                        <span> — {tech.description.slice(0, 60)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <button onClick={addLine}>+ Add technology</button>
      </div>

      <div>
        <h2>Tell us about your stack</h2>
        <label>
          What industries primarily use this stack?
          <input
            type="text"
            value={questionnaire.industries}
            onChange={(e) =>
              setQuestionnaire({ ...questionnaire, industries: e.target.value })
            }
          />
        </label>
        <label>
          What is its most notable feature?
          <input
            type="text"
            value={questionnaire.notableFeature}
            onChange={(e) =>
              setQuestionnaire({
                ...questionnaire,
                notableFeature: e.target.value,
              })
            }
          />
        </label>
        <label>
          What is its biggest competitor?
          <input
            type="text"
            value={questionnaire.competitor}
            onChange={(e) =>
              setQuestionnaire({
                ...questionnaire,
                competitor: e.target.value,
              })
            }
          />
        </label>
      </div>

      {error && <p>{error}</p>}

      <button onClick={handleSave} disabled={!canSave || saving}>
        {saving ? "Inventing..." : "Invent this Stack"}
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Verify the builder renders and typeahead works**

Run: `npm run dev` and visit `http://localhost:3000/build`
Expected: Builder renders, typing searches technologies, acronym forms at top.

- [ ] **Step 3: Commit**

```bash
git add src/app/build/ && git commit -m "feat: add stack builder page with typeahead and live acronym check"
```

---

### Task 22: Client-Side Interactivity (Reroll, Relinquish, Sync)

**Files:**
- Create: `src/components/RerollButton.tsx`
- Create: `src/components/RelinquishButton.tsx`
- Create: `src/components/SyncButton.tsx`

- [ ] **Step 1: Create RerollButton client component**

Create `src/components/RerollButton.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RerollButton({
  acronym,
  rerollsRemaining,
}: {
  acronym: string;
  rerollsRemaining: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReroll = async () => {
    setLoading(true);
    const res = await fetch(`/api/stacks/${acronym}/reroll`, {
      method: "POST",
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setLoading(false);
  };

  return (
    <button onClick={handleReroll} disabled={loading || rerollsRemaining <= 0}>
      {loading
        ? "Rerolling..."
        : `Reroll Description (${rerollsRemaining} left today)`}
    </button>
  );
}
```

- [ ] **Step 2: Create RelinquishButton client component**

Create `src/components/RelinquishButton.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RelinquishButton({ acronym }: { acronym: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRelinquish = async () => {
    setLoading(true);
    const res = await fetch(`/api/stacks/${acronym}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmation: "Yeah it sucks these days anyway",
      }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setLoading(false);
  };

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}>Relinquish</button>
    );
  }

  return (
    <div>
      <p>Are you sure? Type the confirmation to proceed:</p>
      <p><em>&ldquo;Yeah it sucks these days anyway&rdquo;</em></p>
      <button onClick={handleRelinquish} disabled={loading}>
        {loading ? "Relinquishing..." : "Yeah it sucks these days anyway"}
      </button>
      <button onClick={() => setConfirming(false)}>Never mind</button>
    </div>
  );
}
```

- [ ] **Step 3: Create SyncButton client component**

Create `src/components/SyncButton.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton({ username }: { username: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const res = await fetch(`/api/users/${username}/sync`, {
      method: "POST",
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setLoading(false);
  };

  return (
    <button onClick={handleSync} disabled={loading}>
      {loading ? "Syncing..." : "Sync GitHub Data"}
    </button>
  );
}
```

- [ ] **Step 4: Wire components into pages**

Update `src/app/s/[acronym]/page.tsx` to import and use `RerollButton` and `RelinquishButton` instead of the plain `<button>` elements.

Update `src/app/u/[username]/page.tsx` to import and use `SyncButton` instead of the plain `<button>` element.

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/app/s/ src/app/u/ && git commit -m "feat: add client components for reroll, relinquish, and sync"
```

---

### Task 23: Auth UI (Login/Logout)

**Files:**
- Create: `src/components/AuthButton.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create AuthButton client component**

Create `src/components/AuthButton.tsx`:
```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AuthButton({
  user,
}: {
  user: { providerUsername: string } | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (provider: "github" | "gitlab") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div>
        <a href={`/u/${user.providerUsername}`}>@{user.providerUsername}</a>
        <button onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => handleLogin("github")}>
        Sign in with GitHub
      </button>
      <button onClick={() => handleLogin("gitlab")}>
        Sign in with GitLab
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update layout to include auth state**

Update `src/app/layout.tsx` to fetch the current user server-side and pass to AuthButton:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthButton } from "@/components/AuthButton";
import "./globals.css";

export const metadata = {
  title: "Stacklist",
  description: "Claim your stack. There can be only one.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let dbUser = null;
  if (authUser) {
    dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { providerUsername: true },
    });
  }

  return (
    <html lang="en">
      <body>
        <header>
          <a href="/">Stacklist</a>
          <AuthButton user={dbUser} />
        </header>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify login/logout flow**

Run: `npm run dev`, click "Sign in with GitHub", complete OAuth, verify user appears in header.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthButton.tsx src/app/layout.tsx && git commit -m "feat: add auth UI with GitHub/GitLab login"
```

---

### Task 24: End-to-End Smoke Test

**Files:** None (manual verification)

- [ ] **Step 1: Seed the database**

Run: `npx prisma db seed`

- [ ] **Step 2: Test the full flow**

1. Visit `/` — homepage shows Hall of Fame (random) and Just Invented sections
2. Visit `/s/LAMP` — stack detail page shows LAMP stack info
3. Visit `/t/react` — technology page shows React details
4. Sign in with GitHub
5. Visit `/build` — stack builder with typeahead
6. Select technologies, fill questionnaire, save
7. Get redirected to new stack page with LLM description
8. Try reroll (should work twice)
9. Visit `/u/{your-username}` — profile page with GitHub data
10. Click "Sync GitHub Data"
11. Try relinquish on your stack

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: address issues from end-to-end smoke test"
```

---

## Notes

- **Frontend design/styling** is intentionally deferred. All pages are functional but unstyled. Use the `frontend-design` skill as a follow-up to add visual polish.
- **Technology suggestion modal** in the builder (for unknown techs) is stubbed with an error message. Implement the modal UI during the frontend-design pass.
- **Canonical stack seeding** beyond LAMP is blocked on the deep research prompt results. Once inventors are identified, create user records for them and seed additional stacks.
- **GitLab OAuth** requires separate configuration in Supabase dashboard (similar to GitHub setup).
- **The `GITHUB_TOKEN` env var** is optional but recommended to avoid GitHub API rate limits during development.
