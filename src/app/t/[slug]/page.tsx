import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { TextLink } from "@/components/catalyst/text";
import { Badge, BadgeButton } from "@/components/catalyst/badge";
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";

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
        <DescriptionDetails>{technology.githubStars.toLocaleString()}</DescriptionDetails>
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
              <TextLink href={technology.discoveredBy.profileUrl}>
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
            <Subheading className="mb-4">Used in these stacks</Subheading>
            <div className="flex flex-wrap gap-2">
              {technology.stacks.map((st) => (
                <BadgeButton
                  key={st.stack.acronym}
                  href={`/s/${st.stack.acronym}`}
                  color="indigo"
                >
                  {st.stack.acronym}
                  {st.stack.creator && (
                    <span className="text-indigo-500/70 dark:text-indigo-400/70">
                      {" "}by @{st.stack.creator.providerUsername}
                    </span>
                  )}
                </BadgeButton>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
