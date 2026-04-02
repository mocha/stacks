import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { RerollButton } from "@/components/RerollButton";
import { RelinquishButton } from "@/components/RelinquishButton";
import { Text } from "@/components/catalyst/text";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
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
              vendor: true,
              slug: true,
              description: true,
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
      <div className="text-center py-16 sm:py-24">
        <div className="text-7xl sm:text-9xl font-black tracking-tighter text-zinc-950 dark:text-white">
          {acronym.toUpperCase()}
        </div>
        <Text className="mt-6 text-lg sm:text-xl">
          The <span className="font-semibold">{acronym.toUpperCase()}</span> Stack hasn&apos;t been invented yet.
        </Text>
        <Text className="mt-2 text-zinc-400 dark:text-zinc-500">
          Be the first to claim it and make it yours.
        </Text>
        <div className="mt-8">
          <Button href="/build" color="blue" className="text-base px-6 py-2">
            Claim it
          </Button>
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

  const techNames = stack.technologies.map((st) => st.technology.name);
  const spelledOut = techNames.join(", ").replace(/, ([^,]*)$/, ", and $1");

  return (
    <div>
      {/* Big acronym header */}
      <div className="text-7xl sm:text-9xl font-black tracking-tighter text-zinc-950 dark:text-white">
        {stack.acronym}
      </div>

      {/* Attribution line */}
      <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        {stack.creator ? (
          <span>
            Invented by{" "}
            <Link href={`/u/${stack.creator.providerUsername}`} className="text-zinc-950 dark:text-white underline decoration-zinc-400 hover:decoration-zinc-950 dark:hover:decoration-white">
              @{stack.creator.providerUsername}
            </Link>
          </span>
        ) : externalAttribution ? (
          <span>
            Invented by{" "}
            {externalAttribution.inventors.map((inv, i) => (
              <span key={inv.name}>
                {i > 0 && (i === externalAttribution.inventors.length - 1 ? " & " : ", ")}
                {inv.url ? (
                  <a href={inv.url} target="_blank" rel="noopener noreferrer" className="text-zinc-950 dark:text-white underline decoration-zinc-400 hover:decoration-zinc-950 dark:hover:decoration-white">
                    {inv.name}
                  </a>
                ) : (
                  <span className="text-zinc-950 dark:text-white">{inv.name}</span>
                )}
              </span>
            ))}
            {externalAttribution.year && ` (${externalAttribution.year})`}
          </span>
        ) : null}
        {" "}&middot;{" "}
        <time dateTime={stack.createdAt.toISOString()}>
          {stack.createdAt.toLocaleDateString()}
        </time>
        {totalStars > 0 && (
          <>
            {" "}&middot;{" "}
            <span className={
              totalStars > 500000 ? "font-bold text-amber-500" :
              totalStars > 100000 ? "font-bold text-amber-500/80" :
              totalStars > 10000 ? "font-semibold text-yellow-600 dark:text-yellow-400" :
              "text-zinc-500 dark:text-zinc-400"
            }>
              {"★ "}{totalStars.toLocaleString()}
            </span>
          </>
        )}
      </div>

      {/* Spelled out name */}
      <Text className="mt-3 text-lg">
        The {spelledOut} Stack
      </Text>

      <Divider className="my-8" soft />

      {/* Technology cards with highlighted first letter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stack.technologies.map((st) => (
          <Link
            key={st.technologyId}
            href={`/t/${st.technology.slug}`}
            className="group rounded-lg border border-zinc-950/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {st.technology.logoUrl && (
                <img
                  src={st.technology.logoUrl}
                  alt={st.technology.name}
                  width={32}
                  height={32}
                  className="rounded mt-0.5"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {st.technology.name[0]}
                  </span>
                  <span className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {st.technology.name.slice(1)}
                  </span>
                  {st.technology.vendor && (
                    <span className="text-sm text-zinc-400 dark:text-zinc-500 ml-1">
                      by {st.technology.vendor}
                    </span>
                  )}
                </div>
                {st.technology.description && (
                  <Text className="mt-1 text-sm line-clamp-2">
                    {st.technology.description}
                  </Text>
                )}
                {st.technology.githubStars > 0 && (
                  <span className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                    st.technology.githubStars > 100000 ? "text-amber-500" :
                    st.technology.githubStars > 50000 ? "text-yellow-600 dark:text-yellow-400" :
                    st.technology.githubStars > 10000 ? "text-yellow-700/70 dark:text-yellow-500/70" :
                    "text-zinc-400 dark:text-zinc-500"
                  }`}>
                    ★ {st.technology.githubStars.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* LLM Description */}
      <div className="mt-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-950/5 dark:border-white/10 p-6">
        <Text className="!text-base leading-relaxed whitespace-pre-line">{stack.description}</Text>
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
