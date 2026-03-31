import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
