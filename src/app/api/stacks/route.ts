import { prisma } from "@/lib/prisma";
import { buildStackPrompt, generateDescription, summarizeDescription } from "@/lib/llm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  console.log("========= STACK CREATE API HIT =========");

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("[stack create] auth user:", user?.id ?? "none", "error:", error?.message ?? "none");

  if (!user || error) {
    return NextResponse.json({ error: "You must be signed in to create a stack" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { id: true, providerUsername: true },
  });
  console.log("[stack create] db user:", dbUser?.providerUsername ?? "not found");

  if (!dbUser) {
    return NextResponse.json({ error: "User account not found" }, { status: 401 });
  }

  const creatorId = dbUser.id;
  const attribution = { inventors: [{ name: `@${dbUser.providerUsername}`, url: `/u/${dbUser.providerUsername}` }] };

  const body = await request.json();
  const { acronym, technologyIds } = body as {
    acronym: string;
    technologyIds: string[];
  };

  if (!acronym || !technologyIds?.length || technologyIds.length < 2) {
    return NextResponse.json(
      { error: "Acronym and at least 2 technologies are required" },
      { status: 400 }
    );
  }

  // Acronym letters (excluding separators) must match technology count
  const acronymLetters = acronym.replace(/[-_*/:.]/g, "");
  if (acronymLetters.length !== technologyIds.length) {
    return NextResponse.json(
      { error: "Acronym letters must match number of technologies" },
      { status: 400 }
    );
  }

  const technologies = await prisma.technology.findMany({
    where: {
      id: { in: technologyIds },
      status: "approved",
    },
    select: { id: true, name: true, description: true },
  });

  if (technologies.length !== technologyIds.length) {
    return NextResponse.json(
      { error: "One or more technologies not found or not approved" },
      { status: 400 }
    );
  }

  // Reorder technologies to match the intended acronym letters.
  // The frontend and server may disagree on order due to React state timing,
  // so we trust the acronym as the user's intent and reorder to match.
  const techMap = new Map(technologies.map((t: { id: string; name: string; description: string | null }) => [t.id, t]));
  const remainingIds = [...technologyIds];
  const orderedIds: string[] = [];

  for (const letter of acronymLetters) {
    const idx = remainingIds.findIndex((id) => {
      const tech = techMap.get(id);
      return tech && tech.name[0].toUpperCase() === letter.toUpperCase();
    });
    if (idx === -1) {
      return NextResponse.json(
        { error: `No technology starting with "${letter}" found for acronym "${acronym}"` },
        { status: 400 }
      );
    }
    orderedIds.push(remainingIds[idx]);
    remainingIds.splice(idx, 1);
  }

  const orderedTechs = orderedIds.map((id) => techMap.get(id)!);

  const prompt = buildStackPrompt({
    technologies: orderedTechs.map((t) => ({
      name: t.name,
      description: t.description ?? "",
    })),
  });
  const description = await generateDescription(prompt);
  const summary = await summarizeDescription(description);

  try {
    const stack = await prisma.$transaction(async (tx) => {
      const newStack = await tx.stack.create({
        data: {
          acronym,
          creatorId,
          questionnaire: {},
          description,
          summary,
          externalAttribution: attribution,
        },
      });

      await tx.stackTechnology.createMany({
        data: orderedIds.map((techId, index) => ({
          stackId: newStack.id,
          technologyId: techId,
          position: index,
        })),
      });

      return newStack;
    });

    return NextResponse.json({ stack, redirect: `/s/${stack.acronym}` }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "This acronym was just claimed by someone else!" },
        { status: 409 }
      );
    }
    throw error;
  }
}
