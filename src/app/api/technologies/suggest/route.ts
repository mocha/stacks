import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchRepoInfo } from "@/lib/github";
import { vibeCheckUrl } from "@/lib/moderation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, githubUrl } = body;

  if (!name || !githubUrl) {
    return NextResponse.json(
      { error: "Name and GitHub URL are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.technology.findFirst({
    where: { githubUrl },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This technology has already been suggested", technology: existing },
      { status: 409 }
    );
  }

  const repoInfo = await fetchRepoInfo(githubUrl);
  if (!repoInfo) {
    return NextResponse.json(
      { error: "Could not fetch repository info. Is the URL correct?" },
      { status: 400 }
    );
  }

  const vibeCheck = await vibeCheckUrl(name, githubUrl);

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  let finalSlug = slug;
  let counter = 1;
  while (await prisma.technology.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const technology = await prisma.technology.create({
    data: {
      name,
      slug: finalSlug,
      description: repoInfo.description,
      logoUrl: repoInfo.logoUrl,
      githubUrl,
      githubStars: repoInfo.stars,
      language: repoInfo.language,
      status: vibeCheck.ok ? "pending" : "rejected",
      discoveredById: dbUser.id,
    },
  });

  return NextResponse.json({
    technology,
    moderation: vibeCheck,
    message: vibeCheck.ok
      ? "Technology suggested! It will be reviewed before appearing in the picker."
      : `Suggestion rejected: ${vibeCheck.reason}`,
  }, { status: 201 });
}
