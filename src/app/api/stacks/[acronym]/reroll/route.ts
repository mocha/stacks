import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
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
  try {
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

    // Auth check: only the stack creator can reroll
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser || !stack.creatorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!dbUser || dbUser.id !== stack.creatorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const newSummary = await summarizeDescription(newDescription);

    await prisma.stack.update({
      where: { id: stack.id },
      data: {
        description: newDescription,
        summary: newSummary,
        rerollsToday: rerollsUsed + 1,
        lastRerollDate: today,
      },
    });

    return NextResponse.json({
      description: newDescription,
      rerollsRemaining: 1 - rerollsUsed,
    });
  } catch (error) {
    console.error("Reroll error:", error);
    return NextResponse.json(
      { error: "Failed to reroll description. Please try again." },
      { status: 500 }
    );
  }
}
