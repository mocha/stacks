import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === dbUser.supabaseAuthId;

  return (
    <main>
      <div>
        {dbUser.avatarUrl && (
          <img
            src={dbUser.avatarUrl}
            alt={dbUser.providerUsername}
            width={128}
            height={128}
          />
        )}
        <h1>{dbUser.displayName}</h1>
        <p>@{dbUser.providerUsername}</p>
      </div>

      {githubData?.bio && <p>{githubData.bio}</p>}

      <dl>
        {githubData?.location && (
          <>
            <dt>Location</dt>
            <dd>{githubData.location}</dd>
          </>
        )}
        {githubData?.company && (
          <>
            <dt>Company</dt>
            <dd>{githubData.company}</dd>
          </>
        )}
        {githubData?.publicRepos != null && (
          <>
            <dt>Public Repos</dt>
            <dd>{githubData.publicRepos}</dd>
          </>
        )}
        {githubData?.followers != null && (
          <>
            <dt>Followers</dt>
            <dd>{githubData.followers.toLocaleString()}</dd>
          </>
        )}
      </dl>

      {dbUser.stack ? (
        <section>
          <h2>
            Inventor of{" "}
            <Link href={`/s/${dbUser.stack.acronym}`}>
              the {dbUser.stack.acronym} Stack
            </Link>
          </h2>
        </section>
      ) : (
        <section>
          <p>Hasn&apos;t invented a stack yet.</p>
        </section>
      )}

      <div>
        <a
          href={dbUser.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
        {isOwner && (
          <button data-action="sync">Sync GitHub Data</button>
        )}
      </div>

      {dbUser.githubDataSyncedAt && (
        <p>
          Last synced: {dbUser.githubDataSyncedAt.toLocaleDateString()}
        </p>
      )}
    </main>
  );
}
