import { prisma } from "@/lib/prisma";
import { fetchRepoInfo } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, githubUrl } = body;

  if (!name || !githubUrl) {
    return NextResponse.json(
      { error: "Name and GitHub URL are required" },
      { status: 400 }
    );
  }

  // Check if this repo already exists as a technology
  const existing = await prisma.technology.findFirst({
    where: { githubUrl },
  });
  if (existing) {
    return NextResponse.json({ technology: existing });
  }

  const repoInfo = await fetchRepoInfo(githubUrl);
  if (!repoInfo) {
    return NextResponse.json(
      { error: "Could not fetch repository info. Is the URL correct?" },
      { status: 400 }
    );
  }

  // Generate a unique slug from the name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
      status: "approved",
    },
  });

  return NextResponse.json({ technology }, { status: 201 });
}
