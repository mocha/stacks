import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    const stacks = await prisma.stack.findMany({
      take: 5,
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
    <main>
      <section>
        <h1>Stacklist</h1>
        <p>Claim your stack. There can be only one.</p>
        <Link href="/build">Design my Stack</Link>
      </section>

      <div>
        <section>
          <h2>Hall of Fame</h2>
          {hallOfFame.map((stack) => (
            <Link key={stack.id} href={`/s/${stack.acronym}`}>
              <div>
                <span>The {stack.acronym} Stack</span>
                <span>by @{stack.creator.providerUsername}</span>
              </div>
            </Link>
          ))}
        </section>

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
