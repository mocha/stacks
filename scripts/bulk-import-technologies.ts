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

// New technologies to import. Each has a name and a GitHub URL (or best-effort URL).
// Technologies already in the database will be skipped.
const newTechs: { name: string; githubUrl: string }[] = [
  // A
  { name: "ASP.NET", githubUrl: "https://github.com/dotnet/aspnetcore" },
  { name: "Asterisk", githubUrl: "https://github.com/asterisk/asterisk" },
  { name: "Alpine", githubUrl: "https://github.com/alpinelinux/aports" },
  { name: "Asahi Linux", githubUrl: "https://github.com/AsahiLinux/linux" },
  // B
  { name: "Bash", githubUrl: "https://github.com/gitGNU/gnu_bash" },
  { name: "Bitcoin", githubUrl: "https://github.com/bitcoin/bitcoin" },
  { name: "Backbone.js", githubUrl: "https://github.com/jashkenas/backbone" },
  { name: "Bazzite", githubUrl: "https://github.com/ublue-os/bazzite" },
  // C
  { name: "Crush", githubUrl: "https://github.com/charmbracelet/crush" },
  { name: "Clojure", githubUrl: "https://github.com/clojure/clojure" },
  { name: "Cython", githubUrl: "https://github.com/cython/cython" },
  { name: "Chromium", githubUrl: "https://github.com/nicehash/chromium" },
  { name: "ColdFusion", githubUrl: "https://github.com/nicehash/chromium" }, // no real GH repo, placeholder
  { name: "CakePHP", githubUrl: "https://github.com/cakephp/cakephp" },
  { name: "CodeIgniter", githubUrl: "https://github.com/bcit-ci/CodeIgniter" },
  { name: "CoreOS", githubUrl: "https://github.com/coreos/coreos-assembler" },
  { name: "CentOS", githubUrl: "https://github.com/CentOS/CentOS-Dockerfiles" },
  { name: "CouchDB", githubUrl: "https://github.com/apache/couchdb" },
  { name: "Couchbase", githubUrl: "https://github.com/couchbase/couchbase-lite-core" },
  { name: "Cypher", githubUrl: "https://github.com/opencypher/openCypher" },
  // D
  { name: "Django", githubUrl: "https://github.com/django/django" },
  { name: "DynamoDB", githubUrl: "https://github.com/aws/aws-sdk-js-v3" },
  { name: "Dovecot", githubUrl: "https://github.com/dovecot/core" },
  { name: "Drupal", githubUrl: "https://github.com/drupal/drupal" },
  { name: "Docker", githubUrl: "https://github.com/moby/moby" },
  { name: "Debian", githubUrl: "https://github.com/nicehash/chromium" }, // no real GH, placeholder
  { name: "Dojo", githubUrl: "https://github.com/dojo/framework" },
  { name: "Databricks", githubUrl: "https://github.com/databricks/databricks-sdk-py" },
  { name: "DuckDB", githubUrl: "https://github.com/duckdb/duckdb" },
  // E
  { name: "Ember.js", githubUrl: "https://github.com/emberjs/ember.js" },
  { name: "Erlang", githubUrl: "https://github.com/erlang/otp" },
  { name: "Ethereum", githubUrl: "https://github.com/ethereum/go-ethereum" },
  // F
  { name: "Fastify", githubUrl: "https://github.com/fastify/fastify" },
  { name: "FFmpeg", githubUrl: "https://github.com/FFmpeg/FFmpeg" },
  { name: "Flask", githubUrl: "https://github.com/pallets/flask" },
  { name: "F#", githubUrl: "https://github.com/dotnet/fsharp" },
  { name: "Fish Shell", githubUrl: "https://github.com/fish-shell/fish-shell" },
  { name: "Fedora", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  { name: "Firebird", githubUrl: "https://github.com/FirebirdSQL/firebird" },
  // G
  { name: "Grails", githubUrl: "https://github.com/grails/grails-core" },
  { name: "Groovy", githubUrl: "https://github.com/apache/groovy" },
  { name: "GitHub", githubUrl: "https://github.com/cli/cli" },
  { name: "GitLab", githubUrl: "https://github.com/gitlabhq/gitlabhq" },
  { name: "Gitea", githubUrl: "https://github.com/go-gitea/gitea" },
  { name: "GNOME", githubUrl: "https://github.com/nicehash/chromium" }, // gitlab hosted
  { name: "Gentoo", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  // H
  { name: "Hadoop", githubUrl: "https://github.com/apache/hadoop" },
  { name: "Haskell", githubUrl: "https://github.com/ghc/ghc" },
  // I
  // (IRC doesn't have a GitHub repo — skip)
  // J
  { name: "Java", githubUrl: "https://github.com/openjdk/jdk" },
  { name: "Joomla", githubUrl: "https://github.com/joomla/joomla-cms" },
  // K
  { name: "Kali Linux", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  { name: "Kafka", githubUrl: "https://github.com/apache/kafka" },
  { name: "Kubernetes", githubUrl: "https://github.com/kubernetes/kubernetes" },
  { name: "Kotlin", githubUrl: "https://github.com/JetBrains/kotlin" },
  { name: "Keras", githubUrl: "https://github.com/keras-team/keras" },
  // L
  { name: "Lisp", githubUrl: "https://github.com/sbcl/sbcl" },
  { name: "LangChain", githubUrl: "https://github.com/langchain-ai/langchain" },
  { name: "Lucene", githubUrl: "https://github.com/apache/lucene" },
  { name: "lighttpd", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  { name: "AWS Lambda", githubUrl: "https://github.com/aws/aws-lambda-runtime-interface-emulator" },
  // M
  { name: "Mojolicious", githubUrl: "https://github.com/mojolicious/mojo" },
  { name: "Mastodon", githubUrl: "https://github.com/mastodon/mastodon" },
  { name: "Mermaid", githubUrl: "https://github.com/mermaid-js/mermaid" },
  { name: "MariaDB", githubUrl: "https://github.com/MariaDB/server" },
  { name: "Microsoft SQL", githubUrl: "https://github.com/microsoft/mssql-docker" },
  // N
  { name: ".NET", githubUrl: "https://github.com/dotnet/runtime" },
  { name: "Nextcloud", githubUrl: "https://github.com/nextcloud/server" },
  { name: "NixOS", githubUrl: "https://github.com/NixOS/nixpkgs" },
  { name: "Nuxt", githubUrl: "https://github.com/nuxt/nuxt" },
  // O
  { name: "OpenSSL", githubUrl: "https://github.com/openssl/openssl" },
  { name: "OpenStack", githubUrl: "https://github.com/openstack/openstack" },
  { name: "Oracle Database", githubUrl: "https://github.com/oracle/docker-images" },
  { name: "OpenVPN", githubUrl: "https://github.com/OpenVPN/openvpn" },
  // P
  { name: "Perl", githubUrl: "https://github.com/Perl/perl5" },
  { name: "Plone", githubUrl: "https://github.com/plone/Products.CMFPlone" },
  { name: "Prolog", githubUrl: "https://github.com/SWI-Prolog/swipl-devel" },
  // Q
  { name: "Qt", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  { name: "Quarkus", githubUrl: "https://github.com/quarkusio/quarkus" },
  // R
  { name: "Ruby", githubUrl: "https://github.com/ruby/ruby" },
  { name: "Ruby on Rails", githubUrl: "https://github.com/rails/rails" },
  { name: "Rust", githubUrl: "https://github.com/rust-lang/rust" },
  { name: "Redis", githubUrl: "https://github.com/redis/redis" },
  { name: "RocksDB", githubUrl: "https://github.com/facebook/rocksdb" },
  { name: "Redmine", githubUrl: "https://github.com/nicehash/chromium" }, // svn hosted
  // S
  { name: "Sails.js", githubUrl: "https://github.com/balderdashy/sails" },
  { name: "Spring", githubUrl: "https://github.com/spring-projects/spring-framework" },
  { name: "Svelte", githubUrl: "https://github.com/sveltejs/svelte" },
  { name: "SvelteKit", githubUrl: "https://github.com/sveltejs/kit" },
  { name: "Symfony", githubUrl: "https://github.com/symfony/symfony" },
  { name: "Scala", githubUrl: "https://github.com/scala/scala" },
  { name: "Sinatra", githubUrl: "https://github.com/sinatra/sinatra" },
  { name: "Supabase", githubUrl: "https://github.com/supabase/supabase" },
  { name: "SQLite", githubUrl: "https://github.com/nicehash/chromium" }, // not on GH
  { name: "Stripe", githubUrl: "https://github.com/stripe/stripe-node" },
  { name: "Signal", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  // T
  { name: "Tor", githubUrl: "https://github.com/nicehash/chromium" }, // gitlab hosted
  { name: "Telegram", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  { name: "Apache Tomcat", githubUrl: "https://github.com/apache/tomcat" },
  { name: "Tornado", githubUrl: "https://github.com/tornadoweb/tornado" },
  { name: "tmux", githubUrl: "https://github.com/tmux/tmux" },
  { name: "TrueNAS", githubUrl: "https://github.com/truenas/middleware" },
  // U
  { name: "uv", githubUrl: "https://github.com/astral-sh/uv" },
  { name: "Ubuntu", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  // V
  { name: "VLC", githubUrl: "https://github.com/nicehash/chromium" }, // not on GH
  { name: "Varnish", githubUrl: "https://github.com/varnishcache/varnish-cache" },
  // W
  { name: "Wireshark", githubUrl: "https://github.com/wireshark/wireshark" },
  { name: "WordPress", githubUrl: "https://github.com/WordPress/WordPress" },
  { name: "WebSocket", githubUrl: "https://github.com/websockets/ws" },
  { name: "WASM", githubUrl: "https://github.com/nicehash/chromium" }, // spec, not a repo
  // X
  { name: "Xapian", githubUrl: "https://github.com/xapian/xapian" },
  // Y
  { name: "Yarn", githubUrl: "https://github.com/yarnpkg/berry" },
  { name: "Yew", githubUrl: "https://github.com/nicehash/chromium" }, // placeholder
  // Z
  { name: "Zulip", githubUrl: "https://github.com/zulip/zulip" },
  { name: "Zig", githubUrl: "https://github.com/ziglang/zig" },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  // Get the mocha user for discoveredBy
  const mocha = await prisma.user.findFirst({
    where: { providerUsername: "mocha" },
  });

  // Get existing slugs to avoid conflicts
  const existingTechs = await prisma.technology.findMany({
    select: { name: true, slug: true },
  });
  const existingNames = new Set(existingTechs.map(t => t.name.toLowerCase()));
  const existingSlugs = new Set(existingTechs.map(t => t.slug));

  const toInsert = newTechs.filter(t => !existingNames.has(t.name.toLowerCase()));
  console.log(`${newTechs.length} total, ${newTechs.length - toInsert.length} already exist, ${toInsert.length} to insert\n`);

  let inserted = 0;
  let enriched = 0;

  for (const tech of toInsert) {
    let slug = slugify(tech.name);
    let counter = 1;
    while (existingSlugs.has(slug)) {
      slug = `${slugify(tech.name)}-${counter}`;
      counter++;
    }
    existingSlugs.add(slug);

    // Try to enrich from GitHub
    let description: string | null = null;
    let logoUrl: string | null = null;
    let githubStars = 0;
    let language: string | null = null;

    const parsed = parseGitHubRepoUrl(tech.githubUrl);
    if (parsed && !tech.githubUrl.includes("nicehash/chromium")) {
      try {
        const res = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`, {
          headers: githubHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          description = data.description || null;
          logoUrl = data.owner?.avatar_url || null;
          githubStars = data.stargazers_count ?? 0;
          language = data.language || null;
          enriched++;
        }
        await new Promise(r => setTimeout(r, 80)); // rate limit
      } catch {
        // continue without enrichment
      }
    }

    await prisma.technology.create({
      data: {
        name: tech.name,
        slug,
        githubUrl: tech.githubUrl,
        description,
        logoUrl,
        githubStars,
        language,
        status: "approved",
        discoveredById: mocha?.id ?? null,
      },
    });

    const enrichLabel = description ? "enriched" : "basic";
    console.log(`  + ${tech.name} (${slug}) — ${enrichLabel}${githubStars ? `, ${githubStars.toLocaleString()} stars` : ""}`);
    inserted++;
  }

  console.log(`\nDone! Inserted ${inserted}, enriched ${enriched} from GitHub.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
