import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { TextLink } from "@/components/catalyst/text";
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";
import { starColorClass } from "@/lib/stars";
import { StackCard } from "@/components/StackCard";

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
              summary: true,
              createdAt: true,
              externalAttribution: true,
              creator: { select: { providerUsername: true } },
              technologies: {
                include: { technology: { select: { githubStars: true } } },
              },
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
    <div>
      <div className="flex items-center gap-4">
        {technology.logoUrl && (
          <img
            src={technology.logoUrl}
            alt={technology.name}
            width={64}
            height={64}
            className="rounded-lg"
          />
        )}
        <Heading className="!text-3xl">{technology.name}</Heading>
      </div>

      {technology.description && (
        <Text className="mt-4">{technology.description}</Text>
      )}

      <Divider className="my-6" soft />

      <DescriptionList>
        {technology.language && (
          <>
            <DescriptionTerm>Language</DescriptionTerm>
            <DescriptionDetails>{technology.language}</DescriptionDetails>
          </>
        )}
        <DescriptionTerm>GitHub Stars</DescriptionTerm>
        <DescriptionDetails>
          <span className={starColorClass(technology.githubStars)}>
            ★ {technology.githubStars.toLocaleString()}
          </span>
        </DescriptionDetails>
        <DescriptionTerm>GitHub</DescriptionTerm>
        <DescriptionDetails>
          <a
            href={technology.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-950 underline decoration-zinc-950/50 hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:hover:decoration-white"
          >
            {technology.githubUrl}
          </a>
        </DescriptionDetails>
        {technology.discoveredBy && (
          <>
            <DescriptionTerm>Discovered by</DescriptionTerm>
            <DescriptionDetails>
              <TextLink href={`/u/${technology.discoveredBy.providerUsername}`}>
                @{technology.discoveredBy.providerUsername}
              </TextLink>
            </DescriptionDetails>
          </>
        )}
      </DescriptionList>

      {technology.stacks.length > 0 && (
        <>
          <Divider className="my-6" soft />
          <section>
            <h2 className="section-header-purple mb-4 text-2xl font-black">🧩 Used in these stacks</h2>
            <div className="space-y-3">
              {[...technology.stacks]
                .sort((a, b) => new Date(b.stack.createdAt).getTime() - new Date(a.stack.createdAt).getTime())
                .map((st) => (
                  <StackCard
                    key={st.stack.acronym}
                    acronym={st.stack.acronym}
                    summary={st.stack.summary}
                    attribution={stackAttribution(st.stack)}
                    totalStars={st.stack.technologies.reduce((sum, t) => sum + t.technology.githubStars, 0)}
                  />
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
