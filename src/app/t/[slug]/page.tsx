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
                {st.stack.creator && <span> by @{st.stack.creator.providerUsername}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
