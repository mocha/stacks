import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { RerollButton } from "@/components/RerollButton";
import { RelinquishButton } from "@/components/RelinquishButton";

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
          supabaseAuthId: true,
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
      <main>
        <h1>The {acronym.toUpperCase()} Stack</h1>
        <p>Nobody has claimed this one yet.</p>
        <Link href="/build">Invent it yourself</Link>
      </main>
    );
  }

  const totalStars = stack.technologies.reduce(
    (sum, st) => sum + st.technology.githubStars,
    0
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCreator = user?.id === stack.creator.supabaseAuthId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReroll = new Date(stack.lastRerollDate);
  lastReroll.setHours(0, 0, 0, 0);
  const rerollsUsed = lastReroll < today ? 0 : stack.rerollsToday;
  const canReroll = isCreator && rerollsUsed < 2;

  return (
    <main>
      <h1>The {stack.acronym} Stack</h1>

      <div>
        <Link href={stack.creator.profileUrl}>
          {stack.creator.avatarUrl && (
            <img
              src={stack.creator.avatarUrl}
              alt={stack.creator.providerUsername}
              width={32}
              height={32}
            />
          )}
          Invented by @{stack.creator.providerUsername}
        </Link>
        <time dateTime={stack.createdAt.toISOString()}>
          {stack.createdAt.toLocaleDateString()}
        </time>
      </div>

      <div>
        <span>{totalStars.toLocaleString()} stars</span>
      </div>

      <ul>
        {stack.technologies.map((st) => (
          <li key={st.technologyId}>
            <Link href={`/t/${st.technology.slug}`}>
              {st.technology.logoUrl && (
                <img
                  src={st.technology.logoUrl}
                  alt={st.technology.name}
                  width={24}
                  height={24}
                />
              )}
              {st.technology.name}
            </Link>
          </li>
        ))}
      </ul>

      <div>
        <p>{stack.description}</p>
      </div>

      {isCreator && (
        <div>
          {canReroll && (
            <RerollButton acronym={stack.acronym} rerollsRemaining={2 - rerollsUsed} />
          )}
          <RelinquishButton acronym={stack.acronym} />
        </div>
      )}

      {/* Ad placeholder for future use */}
      {/* <div className="ad-slot" data-ad-size="300x250" /> */}
    </main>
  );
}
