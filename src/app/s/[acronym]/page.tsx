import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { RerollButton } from "@/components/RerollButton";
import { RelinquishButton } from "@/components/RelinquishButton";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { TextLink } from "@/components/catalyst/text";
import { Badge } from "@/components/catalyst/badge";
import { Avatar } from "@/components/catalyst/avatar";
import { Button } from "@/components/catalyst/button";
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";

interface Props {
  params: Promise<{ acronym: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { acronym } = await params;
  const stack = await prisma.stack.findUnique({
    where: { acronym },
    select: { acronym: true, description: true },
  });

  if (!stack) {
    return { title: `Claim the ${acronym.toUpperCase()} Stack — Stacklist` };
  }

  return {
    title: `The ${stack.acronym} Stack — Stacklist`,
    description: stack.description.slice(0, 160),
  };
}

export default async function StackDetailPage({ params }: Props) {
  const { acronym } = await params;

  const stack = await prisma.stack.findUnique({
    where: { acronym },
    include: {
      creator: {
        select: {
          id: true,
          providerUsername: true,
          avatarUrl: true,
          profileUrl: true,
        },
      },
      technologies: {
        include: {
          technology: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              githubStars: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!stack) {
    return (
      <div className="text-center py-16">
        <Heading>The {acronym.toUpperCase()} Stack</Heading>
        <Text className="mt-4">Nobody has claimed this one yet.</Text>
        <div className="mt-6">
          <Button href="/build" color="blue">Invent it yourself</Button>
        </div>
      </div>
    );
  }

  const totalStars = stack.technologies.reduce(
    (sum, st) => sum + st.technology.githubStars,
    0
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReroll = new Date(stack.lastRerollDate);
  lastReroll.setHours(0, 0, 0, 0);
  const rerollsUsed = lastReroll < today ? 0 : stack.rerollsToday;
  const canReroll = rerollsUsed < 2;

  const externalAttribution = stack.externalAttribution as {
    inventors: { name: string; url?: string }[];
    year?: number;
    source?: string;
    note?: string;
  } | null;

  return (
    <div>
      <Heading className="!text-3xl sm:!text-4xl">The {stack.acronym} Stack</Heading>

      {/* Creator info */}
      <div className="mt-4 flex items-center gap-3">
        {stack.creator ? (
          <>
            <Avatar
              src={stack.creator.avatarUrl}
              alt={stack.creator.providerUsername}
              className="size-8"
            />
            <div>
              <TextLink href={stack.creator.profileUrl}>
                Invented by @{stack.creator.providerUsername}
              </TextLink>
              <Text className="text-sm">
                <time dateTime={stack.createdAt.toISOString()}>
                  {stack.createdAt.toLocaleDateString()}
                </time>
              </Text>
            </div>
          </>
        ) : externalAttribution ? (
          <div>
            <Text>
              Invented by{" "}
              {externalAttribution.inventors.map((inv, i) => (
                <span key={inv.name}>
                  {i > 0 && (i === externalAttribution.inventors.length - 1 ? " & " : ", ")}
                  {inv.url ? (
                    <a
                      href={inv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-950 underline decoration-zinc-950/50 hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:hover:decoration-white"
                    >
                      {inv.name}
                    </a>
                  ) : (
                    <span className="font-medium text-zinc-950 dark:text-white">{inv.name}</span>
                  )}
                </span>
              ))}
            </Text>
            {externalAttribution.year && (
              <Text className="text-sm">({externalAttribution.year})</Text>
            )}
            {externalAttribution.source && (
              <Text className="text-sm">{externalAttribution.source}</Text>
            )}
          </div>
        ) : null}
      </div>

      <Divider className="my-6" soft />

      {/* Metadata */}
      <DescriptionList>
        <DescriptionTerm>Created</DescriptionTerm>
        <DescriptionDetails>{stack.createdAt.toLocaleDateString()}</DescriptionDetails>
        <DescriptionTerm>Total Stars</DescriptionTerm>
        <DescriptionDetails>{totalStars.toLocaleString()}</DescriptionDetails>
      </DescriptionList>

      <Divider className="my-6" soft />

      {/* Technologies */}
      <div className="space-y-3">
        {stack.technologies.map((st) => (
          <Link
            key={st.technologyId}
            href={`/t/${st.technology.slug}`}
            className="flex items-center gap-3 rounded-lg border border-zinc-950/10 dark:border-white/10 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {st.technology.logoUrl && (
              <img
                src={st.technology.logoUrl}
                alt={st.technology.name}
                width={24}
                height={24}
                className="rounded"
              />
            )}
            <span className="font-medium text-zinc-950 dark:text-white">
              {st.technology.name}
            </span>
            <Badge color="zinc" className="ml-auto">
              {st.technology.githubStars.toLocaleString()} stars
            </Badge>
          </Link>
        ))}
      </div>

      {/* LLM Description */}
      <div className="mt-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-950/5 dark:border-white/10 p-6">
        <Text className="!text-base leading-relaxed">{stack.description}</Text>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3">
        {canReroll && (
          <RerollButton acronym={stack.acronym} rerollsRemaining={2 - rerollsUsed} />
        )}
        <RelinquishButton acronym={stack.acronym} />
      </div>

      {/* Ad placeholder for future use */}
      {/* <div className="ad-slot" data-ad-size="300x250" /> */}
    </div>
  );
}
