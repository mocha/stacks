import { prisma } from "@/lib/prisma";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import Link from "next/link";
import { Button } from "@/components/catalyst/button";
import { starColorClass } from "@/lib/stars";
import { StackCard } from "@/components/StackCard";

async function getHallOfFame() {
  const topStackIds = await prisma.$queryRaw<{ id: string; total_stars: number }[]>`
    SELECT s.id, COALESCE(SUM(t."githubStars"), 0)::int as total_stars
    FROM "Stack" s
    JOIN "StackTechnology" st ON st."stackId" = s.id
    JOIN "Technology" t ON t.id = st."technologyId"
    GROUP BY s.id
    ORDER BY total_stars DESC
    LIMIT 20
  `;

  if (topStackIds.length === 0) return [];

  const stacks = await prisma.stack.findMany({
    where: { id: { in: topStackIds.map(r => r.id) } },
    include: {
      creator: { select: { providerUsername: true, avatarUrl: true } },
      technologies: {
        include: { technology: { select: { name: true, githubStars: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  const idOrder = topStackIds.map(r => r.id);
  return stacks.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));
}

async function getRecentStacks() {
  return prisma.stack.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      creator: { select: { providerUsername: true, avatarUrl: true } },
      technologies: {
        include: { technology: { select: { name: true, githubStars: true } } },
        orderBy: { position: "asc" },
      },
    },
  });
}

async function getTopContributors() {
  const contributors = await prisma.$queryRaw<{
    id: string;
    providerUsername: string;
    avatarUrl: string | null;
    stack_count: number;
    total_stars: number;
  }[]>`
    SELECT
      u.id,
      u."providerUsername",
      u."avatarUrl",
      COUNT(DISTINCT s.id)::int as stack_count,
      COALESCE(SUM(t."githubStars"), 0)::int as total_stars
    FROM "User" u
    JOIN "Stack" s ON s."creatorId" = u.id
    JOIN "StackTechnology" st ON st."stackId" = s.id
    JOIN "Technology" t ON t.id = st."technologyId"
    GROUP BY u.id, u."providerUsername", u."avatarUrl"
    ORDER BY total_stars DESC
    LIMIT 20
  `;
  return contributors;
}

function stackAttribution(stack: {
  creator?: { providerUsername: string } | null;
  externalAttribution?: unknown;
}) {
  if (stack.creator) {
    return `by @${stack.creator.providerUsername}`;
  }
  const attr = stack.externalAttribution as {
    inventors?: { name: string }[];
    year?: number;
  } | null;
  if (attr?.inventors?.length) {
    const names = attr.inventors.map((i) => i.name).join(" & ");
    return attr.year ? `by ${names} (${attr.year})` : `by ${names}`;
  }
  return null;
}


export default async function HomePage() {
  const [hallOfFame, recentStacks, topContributors] = await Promise.all([
    getHallOfFame(),
    getRecentStacks(),
    getTopContributors(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 sm:py-16">
        <Heading className="!text-4xl sm:!text-5xl tracking-tight">Stacklist</Heading>
        <Text className="mt-4 text-lg">Claim your stack. There can be only one.</Text>
        <div className="mt-8">
          <Button href="/build" color="blue" className="!text-xl !px-10 !py-5 !rounded-2xl">Design my Stack</Button>
        </div>
      </section>

      {/* Three-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {/* Hall of Fame */}
        <section>
          <h2 className="section-header-gold mb-4 text-2xl font-black">🏆 Hall of Fame</h2>
          <div className="space-y-3">
            {hallOfFame.map((stack) => (
              <StackCard
                key={stack.id}
                acronym={stack.acronym}
                summary={stack.summary}
                attribution={stackAttribution(stack)}
                totalStars={stack.technologies.reduce((sum, st) => sum + st.technology.githubStars, 0)}
              />
            ))}
          </div>
        </section>

        {/* Just Invented */}
        <section>
          <h2 className="section-header-cyan mb-4 text-2xl font-black">⚡ Just Invented</h2>
          <div className="space-y-3">
            {recentStacks.map((stack) => (
              <StackCard
                key={stack.id}
                acronym={stack.acronym}
                summary={stack.summary}
                attribution={stackAttribution(stack)}
                totalStars={stack.technologies.reduce((sum, st) => sum + st.technology.githubStars, 0)}
              />
            ))}
          </div>
        </section>

        {/* Top Contributors */}
        <section>
          <h2 className="section-header-purple mb-4 text-2xl font-black">🌟 Top Contributors</h2>
          <div className="space-y-3">
            {topContributors.map((user, i) => (
              <Link key={user.id} href={`/u/${user.providerUsername}`} className="block">
                <div className="rounded-lg border border-zinc-950/10 dark:border-white/10 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 w-5 text-right">
                      {i + 1}
                    </span>
                    {user.avatarUrl && (
                      <img src={user.avatarUrl} alt="" className="size-6 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-base text-zinc-950 dark:text-white">
                        @{user.providerUsername}
                      </span>
                      <div className="flex items-center gap-2">
                        <Text className="!text-xs">{user.stack_count} stack{user.stack_count !== 1 ? "s" : ""}</Text>
                        {user.total_stars > 0 && (
                          <span className={`text-xs ${starColorClass(user.total_stars)}`}>
                            ★ {user.total_stars.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
