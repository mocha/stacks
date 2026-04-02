import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { TextLink } from "@/components/catalyst/text";
import { Avatar } from "@/components/catalyst/avatar";
import { Button } from "@/components/catalyst/button";
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} — Stacklist` };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const dbUser = await prisma.user.findFirst({
    where: { providerUsername: username },
    include: {
      stack: {
        select: { acronym: true },
      },
    },
  });

  if (!dbUser) {
    notFound();
  }

  const githubData = dbUser.githubData as {
    bio?: string;
    location?: string;
    company?: string;
    publicRepos?: number;
    followers?: number;
    following?: number;
    htmlUrl?: string;
  } | null;

  return (
    <div>
      {/* Profile header */}
      <div className="flex items-center gap-6">
        <Avatar
          src={dbUser.avatarUrl}
          alt={dbUser.providerUsername}
          initials={dbUser.displayName?.[0]?.toUpperCase()}
          className="size-24 sm:size-28"
        />
        <div>
          <Heading className="!text-3xl">{dbUser.displayName}</Heading>
          <Text className="mt-1">@{dbUser.providerUsername}</Text>
        </div>
      </div>

      {githubData?.bio && (
        <Text className="mt-4">{githubData.bio}</Text>
      )}

      <Divider className="my-6" soft />

      {/* Profile info */}
      <DescriptionList>
        {githubData?.location && (
          <>
            <DescriptionTerm>Location</DescriptionTerm>
            <DescriptionDetails>{githubData.location}</DescriptionDetails>
          </>
        )}
        {githubData?.company && (
          <>
            <DescriptionTerm>Company</DescriptionTerm>
            <DescriptionDetails>{githubData.company}</DescriptionDetails>
          </>
        )}
        {githubData?.publicRepos != null && (
          <>
            <DescriptionTerm>Public Repos</DescriptionTerm>
            <DescriptionDetails>{githubData.publicRepos}</DescriptionDetails>
          </>
        )}
        {githubData?.followers != null && (
          <>
            <DescriptionTerm>Followers</DescriptionTerm>
            <DescriptionDetails>{githubData.followers.toLocaleString()}</DescriptionDetails>
          </>
        )}
      </DescriptionList>

      <Divider className="my-6" soft />

      {/* Stack section — created stacks */}
      {dbUser.stack ? (
        <section className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-950/5 dark:border-white/10 p-6">
          <Subheading>Their Stack</Subheading>
          <div className="mt-2">
            <TextLink href={`/s/${dbUser.stack.acronym}`} className="text-lg font-semibold">
              The {dbUser.stack.acronym} Stack
            </TextLink>
          </div>
        </section>
      ) : (
        <section>
          <Text>Hasn&apos;t invented a stack yet.</Text>
        </section>
      )}

      {/* Stacks by this user via externalAttribution */}
      <Divider className="my-6" soft />
      <section>
        <Subheading className="mb-4">Stacks by @{dbUser.providerUsername}</Subheading>
        <Text>Attribution-based stack listing coming soon.</Text>
      </section>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <Button
          outline
          href={dbUser.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </Button>
      </div>

      {dbUser.githubDataSyncedAt && (
        <Text className="mt-3 text-sm">
          Last synced: {dbUser.githubDataSyncedAt.toLocaleDateString()}
        </Text>
      )}
    </div>
  );
}
