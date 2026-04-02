import { prisma } from "@/lib/prisma";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { TextLink } from "@/components/catalyst/text";
import { Button } from "@/components/catalyst/button";
import { Badge } from "@/components/catalyst/badge";

async function getHallOfFame() {
  // Top stacks ranked by total GitHub stars of their technologies
  const topStackIds = await prisma.$queryRaw<{ id: string; total_stars: number }[]>`
    SELECT s.id, COALESCE(SUM(t."githubStars"), 0)::int as total_stars
    FROM "Stack" s
    JOIN "StackTechnology" st ON st."stackId" = s.id
    JOIN "Technology" t ON t.id = st."technologyId"
    GROUP BY s.id
    ORDER BY total_stars DESC
    LIMIT 5
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

  // Sort by the star ranking from the raw query
  const idOrder = topStackIds.map(r => r.id);
  return stacks.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));
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
  const [hallOfFame, recentStacks] = await Promise.all([
    getHallOfFame(),
    getRecentStacks(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 sm:py-16">
        <Heading className="!text-4xl sm:!text-5xl tracking-tight">Stacklist</Heading>
        <Text className="mt-4 text-lg">Claim your stack. There can be only one.</Text>
        <div className="mt-8">
          <Button href="/build" color="blue">Design my Stack</Button>
        </div>
      </section>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Hall of Fame */}
        <section>
          <Subheading className="mb-4">Hall of Fame</Subheading>
          <div className="space-y-3">
            {hallOfFame.map((stack) => {
              const totalStars = stack.technologies.reduce(
                (sum, st) => sum + st.technology.githubStars,
                0
              );
              const attribution = stackAttribution(stack);
              return (
                <TextLink key={stack.id} href={`/s/${stack.acronym}`} className="block no-underline">
                  <div className="rounded-lg border border-zinc-950/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge color="indigo">{stack.acronym}</Badge>
                        <span className="font-medium text-zinc-950 dark:text-white">
                          The {stack.acronym} Stack
                        </span>
                      </div>
                      {totalStars > 0 && (
                        <span className={`text-sm font-medium ${
                          totalStars > 500000 ? "text-amber-500" :
                          totalStars > 100000 ? "text-amber-500/80" :
                          totalStars > 10000 ? "text-yellow-600 dark:text-yellow-400" :
                          "text-zinc-400 dark:text-zinc-500"
                        }`}>
                          ★ {totalStars.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {attribution && (
                      <Text className="mt-1 text-sm">{attribution}</Text>
                    )}
                  </div>
                </TextLink>
              );
            })}
          </div>
        </section>

        {/* Just Invented */}
        <section>
          <Subheading className="mb-4">Just Invented</Subheading>
          <div className="space-y-3">
            {recentStacks.map((stack) => {
              const totalStars = stack.technologies.reduce(
                (sum, st) => sum + st.technology.githubStars,
                0
              );
              const attribution = stackAttribution(stack);
              return (
                <TextLink key={stack.id} href={`/s/${stack.acronym}`} className="block no-underline">
                  <div className="rounded-lg border border-zinc-950/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge color="zinc">{stack.acronym}</Badge>
                        <span className="font-medium text-zinc-950 dark:text-white">
                          The {stack.acronym} Stack
                        </span>
                      </div>
                      {totalStars > 0 && (
                        <span className={`text-sm font-medium ${
                          totalStars > 500000 ? "text-amber-500" :
                          totalStars > 100000 ? "text-amber-500/80" :
                          totalStars > 10000 ? "text-yellow-600 dark:text-yellow-400" :
                          "text-zinc-400 dark:text-zinc-500"
                        }`}>
                          ★ {totalStars.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {attribution && (
                      <Text className="mt-1 text-sm">{attribution}</Text>
                    )}
                  </div>
                </TextLink>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
