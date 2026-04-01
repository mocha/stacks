import { prisma } from "@/lib/prisma";
import {
  buildRerollPrompt,
  generateDescription,
  summarizeDescription,
} from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ acronym: string }> }
) {
  const { acronym } = await params;

  const stack = await prisma.stack.findUnique({
    where: { acronym },
    include: {
      technologies: {
        include: { technology: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReroll = new Date(stack.lastRerollDate);
  lastReroll.setHours(0, 0, 0, 0);

  let rerollsUsed = stack.rerollsToday;
  if (lastReroll < today) {
    rerollsUsed = 0;
  }

  if (rerollsUsed >= 2) {
    return NextResponse.json(
      { error: "You've used both rerolls for today. Try again tomorrow." },
      { status: 429 }
    );
  }

  const oldSummary = await summarizeDescription(stack.description);

  const prompt = buildRerollPrompt({
    technologies: stack.technologies.map((st: { technology: { name: string; description: string | null } }) => ({
      name: st.technology.name,
      description: st.technology.description ?? "",
    })),
    oldDescriptionSummary: oldSummary,
  });

  const newDescription = await generateDescription(prompt);

  await prisma.stack.update({
    where: { id: stack.id },
    data: {
      description: newDescription,
      rerollsToday: rerollsUsed + 1,
      lastRerollDate: today,
    },
  });

  return NextResponse.json({
    description: newDescription,
    rerollsRemaining: 1 - rerollsUsed,
  });
}
