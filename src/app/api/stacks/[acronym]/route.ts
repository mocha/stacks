import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ acronym: string }> }
) {
  const { acronym } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  const stack = await prisma.stack.findUnique({
    where: { acronym },
  });

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  if (stack.creatorId !== dbUser?.id) {
    return NextResponse.json(
      { error: "Only the inventor can relinquish their stack" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));

  if (body.confirmation !== "Yeah it sucks these days anyway") {
    return NextResponse.json(
      { error: "Invalid confirmation", expected: "Yeah it sucks these days anyway" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.stack.delete({ where: { id: stack.id } }),
    prisma.user.update({
      where: { id: dbUser!.id },
      data: { hasStack: false },
    }),
  ]);

  return NextResponse.json({ message: "Stack relinquished. The acronym is free." });
}
