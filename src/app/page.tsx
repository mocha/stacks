import { prisma } from "@/lib/prisma";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { TextLink } from "@/components/catalyst/text";
import { Button } from "@/components/catalyst/button";
import { Badge } from "@/components/catalyst/badge";

async function getHallOfFame() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = await prisma.hallOfFame.findMany({
    where: { pickedOn: today },
    include: {
      stack: {
        include: {
          creator: { select: { providerUsername: true, avatarUrl: true } },
          technologies: {
            include: { technology: { select: { name: true, githubStars: true } } },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (entries.length === 0) {
    // Fallback: pick 5 random stacks inline
    const randomIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Stack" ORDER BY RANDOM() LIMIT 5
    `;
    if (randomIds.length === 0) return [];
    const stacks = await prisma.stack.findMany({
      where: { id: { in: randomIds.map(r => r.id) } },
      include: {
        creator: { select: { providerUsername: true, avatarUrl: true } },
        technologies: {
          include: { technology: { select: { name: true, githubStars: true } } },
          orderBy: { position: "asc" },
        },
      },
    });
    return stacks;
  }

  return entries.map((e) => e.stack);
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
            {hallOfFame.map((stack) => (
              <TextLink key={stack.id} href={`/s/${stack.acronym}`} className="block no-underline">
                <div className="rounded-lg border border-zinc-950/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge color="indigo">{stack.acronym}</Badge>
                    <span className="font-medium text-zinc-950 dark:text-white">
                      The {stack.acronym} Stack
                    </span>
                  </div>
                  <Text className="mt-1 text-sm">
                    by {stack.creator ? `@${stack.creator.providerUsername}` : "its canonical inventors"}
                  </Text>
                </div>
              </TextLink>
            ))}
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
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {totalStars.toLocaleString()} stars
                      </span>
                    </div>
                    <Text className="mt-1 text-sm">
                      by {stack.creator ? `@${stack.creator.providerUsername}` : "its canonical inventors"}
                    </Text>
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
