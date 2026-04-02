import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/vnd.github.v3+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseGitHubRepoUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function main() {
  const technologies = await prisma.technology.findMany({
    where: { status: "approved" },
  });

  console.log(`Enriching ${technologies.length} technologies...\n`);

  for (const tech of technologies) {
    const parsed = parseGitHubRepoUrl(tech.githubUrl);
    if (!parsed) {
      console.log(`  SKIP ${tech.name} — not a GitHub URL`);
      continue;
    }

    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`,
        {
          headers: githubHeaders(),
        }
      );

      if (!res.ok) {
        console.log(`  FAIL ${tech.name} — ${res.status} ${res.statusText}`);
        continue;
      }

      const data = await res.json();

      await prisma.technology.update({
        where: { id: tech.id },
        data: {
          description: data.description || tech.description,
          logoUrl: data.owner?.avatar_url || tech.logoUrl,
          githubStars: data.stargazers_count ?? tech.githubStars,
          language: data.language || tech.language,
        },
      });

      console.log(
        `  OK ${tech.name} — ${data.stargazers_count?.toLocaleString()} stars`
      );
    } catch (e) {
      console.log(`  ERROR ${tech.name} — ${e}`);
    }

    // Rate limit courtesy
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
