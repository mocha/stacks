import { prisma } from "@/lib/prisma";
import { buildStackPrompt, generateDescription } from "@/lib/llm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let creatorId: string | null = null;
  let attribution: object = { inventors: [{ name: "Anonymous" }] };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id },
        select: { id: true, providerUsername: true },
      });
      if (dbUser) {
        creatorId = dbUser.id;
        attribution = { inventors: [{ name: `@${dbUser.providerUsername}`, url: `/u/${dbUser.providerUsername}` }] };
      }
    }
  } catch {
    // Not logged in — that's fine
  }

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

  if (acronym.length !== technologyIds.length) {
    return NextResponse.json(
      { error: "Acronym length must match number of technologies" },
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

  const orderedTechs = technologyIds.map((id) =>
    technologies.find((t: { id: string }) => t.id === id)!
  );
  const builtAcronym = orderedTechs
    .map((t) => t.name[0].toUpperCase())
    .join("");
  if (builtAcronym.toUpperCase() !== acronym.toUpperCase()) {
    return NextResponse.json(
      { error: `Technologies spell "${builtAcronym}", not "${acronym}"` },
      { status: 400 }
    );
  }

  const prompt = buildStackPrompt({
    technologies: orderedTechs.map((t) => ({
      name: t.name,
      description: t.description ?? "",
    })),
  });
  const description = await generateDescription(prompt);

  try {
    const stack = await prisma.$transaction(async (tx) => {
      const newStack = await tx.stack.create({
        data: {
          acronym,
          creatorId,
          questionnaire: {},
          description,
          externalAttribution: attribution,
        },
      });

      await tx.stackTechnology.createMany({
        data: technologyIds.map((techId, index) => ({
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
