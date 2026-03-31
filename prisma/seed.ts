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
  // Create the @mocha placeholder user (discoverer of all seeded technologies)
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

  // --- Technologies ---
  const techData = [
    // LAMP family
    { name: "Linux", slug: "linux", githubUrl: "https://github.com/torvalds/linux", language: "C" },
    { name: "Apache", slug: "apache", githubUrl: "https://github.com/apache/httpd", language: "C" },
    { name: "MySQL", slug: "mysql", githubUrl: "https://github.com/mysql/mysql-server", language: "C++" },
    { name: "PHP", slug: "php", githubUrl: "https://github.com/php/php-src", language: "C" },
    { name: "Nginx", slug: "nginx", githubUrl: "https://github.com/nginx/nginx", language: "C" },
    { name: "PostgreSQL", slug: "postgresql", githubUrl: "https://github.com/postgres/postgres", language: "C" },
    // JavaScript full-stack
    { name: "MongoDB", slug: "mongodb", githubUrl: "https://github.com/mongodb/mongo", language: "C++" },
    { name: "Express", slug: "express", githubUrl: "https://github.com/expressjs/express", language: "JavaScript" },
    { name: "Angular", slug: "angular", githubUrl: "https://github.com/angular/angular", language: "TypeScript" },
    { name: "Node.js", slug: "nodejs", githubUrl: "https://github.com/nodejs/node", language: "JavaScript" },
    { name: "React", slug: "react", githubUrl: "https://github.com/facebook/react", language: "JavaScript" },
    { name: "Vue.js", slug: "vuejs", githubUrl: "https://github.com/vuejs/core", language: "TypeScript" },
    // ELK
    { name: "Elasticsearch", slug: "elasticsearch", githubUrl: "https://github.com/elastic/elasticsearch", language: "Java" },
    { name: "Logstash", slug: "logstash", githubUrl: "https://github.com/elastic/logstash", language: "Ruby" },
    { name: "Kibana", slug: "kibana", githubUrl: "https://github.com/elastic/kibana", language: "TypeScript" },
    // JAMstack
    { name: "JavaScript", slug: "javascript", githubUrl: "https://github.com/nicolo-ribaudo/tc39-proposal-ecma-262", language: "JavaScript" },
    // TALL
    { name: "Tailwind CSS", slug: "tailwindcss", githubUrl: "https://github.com/tailwindlabs/tailwindcss", language: "TypeScript" },
    { name: "Alpine.js", slug: "alpinejs", githubUrl: "https://github.com/alpinejs/alpine", language: "JavaScript" },
    { name: "Laravel", slug: "laravel", githubUrl: "https://github.com/laravel/laravel", language: "PHP" },
    { name: "Livewire", slug: "livewire", githubUrl: "https://github.com/livewire/livewire", language: "PHP" },
    // PERN
    // (PostgreSQL, Express, React, Node already above)
    // GRAND
    { name: "GraphQL", slug: "graphql", githubUrl: "https://github.com/graphql/graphql-js", language: "TypeScript" },
    { name: "Apollo", slug: "apollo", githubUrl: "https://github.com/apollographql/apollo-client", language: "TypeScript" },
    { name: "Neo4j", slug: "neo4j", githubUrl: "https://github.com/neo4j/neo4j", language: "Java" },
    // BETH
    { name: "Bun", slug: "bun", githubUrl: "https://github.com/oven-sh/bun", language: "Zig" },
    { name: "Elysia", slug: "elysia", githubUrl: "https://github.com/elysiajs/elysia", language: "TypeScript" },
    { name: "Turso", slug: "turso", githubUrl: "https://github.com/tursodatabase/libsql", language: "Rust" },
    { name: "HTMX", slug: "htmx", githubUrl: "https://github.com/bigskysoftware/htmx", language: "JavaScript" },
    // PETAL
    { name: "Phoenix", slug: "phoenix", githubUrl: "https://github.com/phoenixframework/phoenix", language: "Elixir" },
    { name: "Elixir", slug: "elixir", githubUrl: "https://github.com/elixir-lang/elixir", language: "Elixir" },
    { name: "LiveView", slug: "liveview", githubUrl: "https://github.com/phoenixframework/phoenix_live_view", language: "Elixir" },
    // FARM
    { name: "FastAPI", slug: "fastapi", githubUrl: "https://github.com/fastapi/fastapi", language: "Python" },
    // T3 extras
    { name: "Next.js", slug: "nextjs", githubUrl: "https://github.com/vercel/next.js", language: "TypeScript" },
    { name: "TypeScript", slug: "typescript", githubUrl: "https://github.com/microsoft/TypeScript", language: "TypeScript" },
    { name: "tRPC", slug: "trpc", githubUrl: "https://github.com/trpc/trpc", language: "TypeScript" },
    { name: "Prisma", slug: "prisma", githubUrl: "https://github.com/prisma/prisma", language: "TypeScript" },
    // VILT
    { name: "Inertia.js", slug: "inertiajs", githubUrl: "https://github.com/inertiajs/inertia", language: "TypeScript" },
    // SAFE
    { name: "Saturn", slug: "saturn", githubUrl: "https://github.com/SaturnFramework/Saturn", language: "F#" },
    { name: "Fable", slug: "fable", githubUrl: "https://github.com/fable-compiler/Fable", language: "F#" },
    { name: "Elmish", slug: "elmish", githubUrl: "https://github.com/elmish/elmish", language: "F#" },
    // Firebase for FERN
    { name: "Firebase", slug: "firebase", githubUrl: "https://github.com/firebase/firebase-js-sdk", language: "TypeScript" },
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

  // --- Canonical Stacks ---
  // These use externalAttribution instead of creatorId.
  // Seeded from deep research: docs/research/canonical-stacks.md

  const canonicalStacks = [
    {
      acronym: "LAMP",
      techNames: ["Linux", "Apache", "MySQL", "PHP"],
      questionnaire: {
        industries: "Web hosting, enterprise web applications",
        notableFeature: "The OG open-source web stack",
        competitor: "Microsoft's IIS + SQL Server stack",
      },
      description: "Ah, the LAMP stack — the granddaddy of them all. Linux keeps the lights on (literally, it IS the light), Apache serves your pages like a tireless waiter who never takes a break, MySQL remembers everything you've ever told it in neat little rows and columns, and PHP... well, PHP ties it all together with the enthusiasm of a developer who discovered string concatenation and never looked back. Together, they power roughly half the internet, including every WordPress blog your aunt has ever started and abandoned.",
      externalAttribution: {
        inventors: [{ name: "Michael Kunze", url: "https://en.wikipedia.org/wiki/LAMP_(software_bundle)" }],
        year: 1998,
        source: "c't magazine (Germany)",
        note: "Kunze deliberately coined the acronym as a marketing device for free/open-source software.",
      },
    },
    {
      acronym: "MEAN",
      techNames: ["MongoDB", "Express", "Angular", "Node.js"],
      questionnaire: {
        industries: "Full-stack JavaScript web applications, startups",
        notableFeature: "JavaScript everywhere — front to back",
        competitor: "LAMP",
      },
      description: "The MEAN stack is what happens when JavaScript developers look at the server and say 'we can take that too.' MongoDB stores your data as JSON (because everything is JSON now), Express handles routing with the quiet competence of a librarian, Angular builds your frontend with more decorators than a Christmas tree, and Node.js ties it all together by running JavaScript on the server — something that was once considered a war crime. It's JavaScript all the way down, which is either brilliant or terrifying depending on your relationship with callback functions.",
      externalAttribution: {
        inventors: [{ name: "Valeri Karpov", url: "https://thecodebarbarian.com" }],
        year: 2013,
        source: "Blog post: 'The MEAN Stack' on thecodebarbarian.com",
        note: "Karpov was a Node.js engineer at MongoDB. He coined it saying: 'My team uses a set of tools that we affectionately call the MEAN stack.'",
      },
    },
    {
      acronym: "MERN",
      techNames: ["MongoDB", "Express", "React", "Node.js"],
      questionnaire: {
        industries: "Single-page applications, startups, bootcamps",
        notableFeature: "React's component model for building UIs",
        competitor: "MEAN (Angular instead of React)",
      },
      description: "MERN is MEAN's cooler younger sibling who showed up to the party wearing React instead of Angular and immediately became more popular. MongoDB still stores your documents, Express still routes your requests, and Node.js still runs your server — but React brings the component-based UI magic that makes frontend developers feel like they're building with Lego instead of wrestling with spaghetti. It dominates bootcamp curricula worldwide, which means roughly 40% of all junior developer portfolios are built on it.",
      externalAttribution: {
        inventors: [{ name: "Community" }],
        year: 2015,
        source: "Popularized by Hashnode's mern-starter project",
        note: "Natural evolution from MEAN as React surpassed Angular in popularity. No single coiner identified.",
      },
    },
    {
      acronym: "PERN",
      techNames: ["PostgreSQL", "Express", "React", "Node.js"],
      questionnaire: {
        industries: "Web applications requiring relational data integrity",
        notableFeature: "PostgreSQL's relational power with React's UI model",
        competitor: "MERN (MongoDB instead of PostgreSQL)",
      },
      description: "PERN is for developers who looked at MERN and said 'I love everything about this except the part where my data has no schema.' PostgreSQL brings actual relational integrity — foreign keys, constraints, the works — while Express and Node.js handle the server side and React makes the frontend sparkle. It's the responsible adult version of the JavaScript full-stack, chosen by teams who've been burned by MongoDB's 'eh, just throw it in a document' approach one too many times.",
      externalAttribution: {
        inventors: [{ name: "Dan", url: "https://dandreamsofcoding.com/2016/07/25/the-pern-stack/" }],
        year: 2016,
        source: "Blog post on dandreamsofcoding.com",
      },
    },
    {
      acronym: "ELK",
      techNames: ["Elasticsearch", "Logstash", "Kibana"],
      questionnaire: {
        industries: "DevOps, observability, log analytics",
        notableFeature: "Full-text search across all your logs",
        competitor: "Splunk",
      },
      description: "The ELK stack is what happens when you have so many logs that you need a search engine just to find out what went wrong at 3 AM. Elasticsearch indexes everything faster than you can say 'why is the server on fire,' Logstash ingests data from approximately nine thousand different sources and transforms it into something useful, and Kibana turns all that chaos into beautiful dashboards that make your ops team look like they know what they're doing. Used by Netflix, eBay, and every SRE who's ever been paged at dinner.",
      externalAttribution: {
        inventors: [
          { name: "Shay Banon", url: "https://en.wikipedia.org/wiki/Elasticsearch" },
          { name: "Jordan Sissel" },
          { name: "Rashid Khan" },
        ],
        year: 2013,
        source: "Community-coined after the three creators joined Elastic",
        note: "Officially rebranded to 'Elastic Stack' in 2016 to accommodate Beats, but everyone still calls it ELK.",
      },
    },
    {
      acronym: "TALL",
      techNames: ["Tailwind CSS", "Alpine.js", "Laravel", "Livewire"],
      questionnaire: {
        industries: "Rapid web application development, Laravel ecosystem",
        notableFeature: "Full-stack reactivity without leaving PHP",
        competitor: "VILT (Vue + Inertia + Laravel + Tailwind)",
      },
      description: "The TALL stack is the Laravel community's answer to JavaScript fatigue. Tailwind CSS makes your HTML look like someone spilled a Scrabble board on it but somehow it comes out beautiful, Alpine.js adds just enough interactivity without requiring a build step, Laravel provides the most elegant PHP framework known to humanity, and Livewire lets you build reactive UIs entirely in PHP — because who needs a JavaScript framework when you have Caleb Porzio's sheer force of will? It's full-stack development for people who actually like PHP.",
      externalAttribution: {
        inventors: [
          { name: "Caleb Porzio", url: "https://github.com/calebporzio" },
          { name: "Matt Stauffer" },
          { name: "Tony Lea" },
        ],
        year: 2020,
        source: "tallstack.dev",
        note: "Porzio created both Alpine.js and Livewire, making him the most likely originator.",
      },
    },
    {
      acronym: "BETH",
      techNames: ["Bun", "Elysia", "Turso", "HTMX"],
      questionnaire: {
        industries: "Hypermedia-driven web applications",
        notableFeature: "Server-rendered HTML with minimal JavaScript",
        competitor: "MERN, Next.js",
      },
      description: "The BETH stack is the hipster cousin who showed up to Thanksgiving dinner and won't stop talking about how we've been doing web development wrong for fifteen years. Bun runs your JavaScript faster than Node ever could (and lets you know about it), Elysia serves your routes with TypeScript-first elegance, Turso keeps your SQLite database at the edge because latency is the enemy, and HTMX lets you build interactive UIs by... writing HTML attributes. That's it. No virtual DOM, no hydration, no build step — just good old hypermedia the way Tim Berners-Lee intended.",
      externalAttribution: {
        inventors: [{ name: "Ethan Niser", url: "https://github.com/ethanniser" }],
        year: 2023,
        source: "YouTube video and GitHub repo",
      },
    },
    {
      acronym: "PETAL",
      techNames: ["Phoenix", "Elixir", "Tailwind CSS", "Alpine.js", "LiveView"],
      questionnaire: {
        industries: "Real-time web applications, high-concurrency systems",
        notableFeature: "Real-time server-rendered UIs on the BEAM VM",
        competitor: "Rails + Hotwire, Next.js",
      },
      description: "The PETAL stack is what you get when Erlang's battle-tested concurrency model puts on a beautiful dress and goes to a web development party. Phoenix handles your web layer with Rails-like productivity, Elixir makes functional programming feel friendly, Tailwind CSS keeps things pretty, Alpine.js adds client-side sprinkles, and LiveView — the real star — lets you build real-time interactive UIs with server-rendered HTML pushed over WebSockets. No JavaScript framework needed. Your app can handle two million simultaneous connections on a single server, which is probably overkill for your todo app but very impressive at parties.",
      externalAttribution: {
        inventors: [{ name: "Patrick Thompson" }],
        year: 2020,
        source: "Thinking Elixir Podcast",
      },
    },
    {
      acronym: "GRAND",
      techNames: ["GraphQL", "React", "Apollo", "Neo4j"],
      questionnaire: {
        industries: "Graph-heavy applications, knowledge management, social networks",
        notableFeature: "Graph database with GraphQL API — graphs all the way down",
        competitor: "MERN with REST APIs",
      },
      description: "The GRAND stack is for developers who realized their data is more about relationships than rows. GraphQL lets your frontend ask for exactly what it needs (no more, no less), React renders it beautifully, Apollo manages the data layer with caching that actually works, and Neo4j stores everything as nodes and edges because your data is a graph whether you admit it or not. It's particularly popular for recommendation engines, fraud detection, and that social network you're definitely going to build someday.",
      externalAttribution: {
        inventors: [{ name: "William Lyon", url: "https://lyonwj.com" }],
        year: 2017,
        source: "Announced at GraphQL Summit 2017",
        note: "Lyon was Staff Developer Advocate at Neo4j.",
      },
    },
    {
      acronym: "SAFE",
      techNames: ["Saturn", "Fable", "Elmish"],
      questionnaire: {
        industries: "Enterprise web applications in the .NET/F# ecosystem",
        notableFeature: "End-to-end F# — functional programming from server to browser",
        competitor: "ASP.NET + React",
      },
      description: "The SAFE stack is functional programming's answer to full-stack web development, and it's entirely in F#. Saturn provides the server framework with an elegant computation expression API, Azure hosts it all in Microsoft's cloud, Fable compiles your F# to JavaScript (because why would you write JavaScript when you could write F# instead?), and Elmish brings the Elm architecture to your frontend. It's type-safe from database to DOM, which means if it compiles, it probably works. The F# community is small but fierce, and SAFE is their crown jewel.",
      externalAttribution: {
        inventors: [{ name: "Isaac Abraham", url: "https://www.compositional-it.com" }],
        year: 2017,
        source: "safe-stack.github.io",
      },
    },
    {
      acronym: "FARM",
      techNames: ["FastAPI", "React", "MongoDB"],
      questionnaire: {
        industries: "Modern Python web applications, APIs, data science frontends",
        notableFeature: "FastAPI's automatic OpenAPI docs and async Python",
        competitor: "Django + React",
      },
      description: "The FARM stack is what happens when Python developers finally get a web framework that's as fast as they always claimed Python could be. FastAPI serves your API with automatic documentation, type validation, and async support that makes Flask look like it's running on a hamster wheel. React handles the frontend because what else would you use, and MongoDB stores your data as documents because your Python dicts were basically JSON anyway. It's the modern Python web stack for people who want type hints, speed, and zero boilerplate.",
      externalAttribution: {
        inventors: [{ name: "Community" }],
        year: 2021,
        source: "Popularized by MongoDB Developer Blog",
      },
    },
    {
      acronym: "FERN",
      techNames: ["Firebase", "Express", "React", "Node.js"],
      questionnaire: {
        industries: "Real-time apps, rapid prototyping, hackathons",
        notableFeature: "Firebase's real-time database and zero-config auth",
        competitor: "MERN (self-hosted MongoDB instead of Firebase)",
      },
      description: "The FERN stack is MERN's cloud-native cousin who traded self-hosted MongoDB for Firebase and never looked back. Firebase handles auth, real-time database, hosting, and approximately seventeen other things you'd otherwise have to set up yourself. Express and Node.js do the server-side heavy lifting, and React builds the UI. It's the stack of choice for hackathons, MVPs, and that side project you're going to ship this weekend (you won't, but Firebase makes it feel possible).",
      externalAttribution: {
        inventors: [{ name: "Community" }],
        year: 2019,
        source: "Various dev.to discussions",
      },
    },
  ];

  for (const s of canonicalStacks) {
    const existing = await prisma.stack.findUnique({ where: { acronym: s.acronym } });
    if (existing) {
      console.log(`  ${s.acronym} already exists, skipping`);
      continue;
    }

    const stack = await prisma.stack.create({
      data: {
        acronym: s.acronym,
        creatorId: null,
        questionnaire: s.questionnaire,
        description: s.description,
        externalAttribution: s.externalAttribution,
      },
    });

    for (let i = 0; i < s.techNames.length; i++) {
      const techId = techs[s.techNames[i]];
      if (techId) {
        await prisma.stackTechnology.create({
          data: { stackId: stack.id, technologyId: techId, position: i },
        });
      } else {
        console.warn(`  Warning: tech "${s.techNames[i]}" not found for ${s.acronym}`);
      }
    }

    console.log(`  Seeded ${s.acronym}`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
