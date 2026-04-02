import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { fetchUserProfile } from "@/lib/github";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Heading } from "@/components/catalyst/heading";
import { Subheading } from "@/components/catalyst/heading";
import { Text, TextLink } from "@/components/catalyst/text";
import { Avatar } from "@/components/catalyst/avatar";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { DeleteStackButton } from "@/components/DeleteStackButton";

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
  });

  if (!dbUser) {
    notFound();
  }

  // Fetch stacks created by this user, including technologies for star calculation
  const stacks = await prisma.stack.findMany({
    where: { creatorId: dbUser.id },
    include: {
      technologies: {
        include: {
          technology: {
            select: { name: true, githubStars: true },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate total stars across all stacks
  const totalStars = stacks.reduce(
    (sum, stack) =>
      sum + stack.technologies.reduce((s, st) => s + st.technology.githubStars, 0),
    0
  );

  // Fetch live GitHub profile data (fallback to DB data on failure)
  let githubProfile = await fetchUserProfile(username).catch(() => null);

  // Fallback: use cached DB data if GitHub API fails
  const cachedGithub = dbUser.githubData as {
    bio?: string;
    location?: string;
    company?: string;
    followers?: number;
    following?: number;
    htmlUrl?: string;
  } | null;

  const displayName = githubProfile?.name ?? dbUser.displayName;
  const avatarUrl = githubProfile?.avatarUrl ?? dbUser.avatarUrl;
  const bio = githubProfile?.bio || cachedGithub?.bio || "";
  const location = githubProfile?.location || cachedGithub?.location || "";
  const company = githubProfile?.company || cachedGithub?.company || "";
  const followers = githubProfile?.followers ?? cachedGithub?.followers ?? null;
  const following = githubProfile?.following ?? cachedGithub?.following ?? null;
  const htmlUrl = githubProfile?.htmlUrl ?? cachedGithub?.htmlUrl ?? dbUser.profileUrl;

  // Determine if the logged-in user is viewing their own profile
  let isOwner = false;
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      isOwner = authUser.id === dbUser.supabaseAuthId;
    }
  } catch {
    // Not logged in or auth error — isOwner stays false
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12">
      {/* Left sidebar */}
      <div className="md:w-1/3 flex-shrink-0">
        <Avatar
          src={avatarUrl}
          alt={username}
          initials={displayName?.[0]?.toUpperCase()}
          className="size-48 sm:size-64 rounded-full"
        />

        <div className="mt-4">
          <Heading className="!text-2xl">{displayName}</Heading>
          <Text className="text-zinc-500 dark:text-zinc-400">@{username}</Text>
        </div>

        {bio && <Text className="mt-3">{bio}</Text>}

        <div className="mt-4 space-y-1">
          {company && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>🏢</span>
              <span>{company}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>📍</span>
              <span>{location}</span>
            </div>
          )}
          {htmlUrl && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>🔗</span>
              <a
                href={htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub Profile
              </a>
            </div>
          )}
        </div>

        {(followers !== null || following !== null) && (
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            {followers !== null && (
              <span>
                <span className="font-semibold text-zinc-950 dark:text-white">
                  {followers.toLocaleString()}
                </span>{" "}
                followers
              </span>
            )}
            {following !== null && (
              <span>
                <span className="font-semibold text-zinc-950 dark:text-white">
                  {following.toLocaleString()}
                </span>{" "}
                following
              </span>
            )}
          </div>
        )}

        {totalStars > 0 && (
          <div className="mt-4">
            <span
              className={`text-lg font-bold ${
                totalStars > 500000
                  ? "text-amber-500"
                  : totalStars > 100000
                    ? "text-amber-500/80"
                    : totalStars > 10000
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              ★ {totalStars.toLocaleString()} total stack stars
            </span>
          </div>
        )}
      </div>

      {/* Right content area */}
      <div className="md:w-2/3 min-w-0">
        <Subheading className="mb-4">Stacks by @{username}</Subheading>

        {stacks.length === 0 ? (
          <Text>No stacks invented yet.</Text>
        ) : (
          <div className="space-y-3">
            {stacks.map((stack) => {
              const stackStars = stack.technologies.reduce(
                (sum, st) => sum + st.technology.githubStars,
                0
              );
              return (
                <div
                  key={stack.id}
                  className="rounded-lg border border-zinc-950/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <TextLink
                      href={`/s/${stack.acronym}`}
                      className="flex items-center gap-3 no-underline"
                    >
                      <Badge color="indigo">{stack.acronym}</Badge>
                      <span className="font-medium text-zinc-950 dark:text-white">
                        The {stack.acronym} Stack
                      </span>
                    </TextLink>
                    <div className="flex items-center gap-2">
                      {stackStars > 0 && (
                        <span
                          className={`text-sm font-medium ${
                            stackStars > 500000
                              ? "text-amber-500"
                              : stackStars > 100000
                                ? "text-amber-500/80"
                                : stackStars > 10000
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-zinc-400 dark:text-zinc-500"
                          }`}
                        >
                          ★ {stackStars.toLocaleString()}
                        </span>
                      )}
                      {isOwner && <DeleteStackButton acronym={stack.acronym} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
