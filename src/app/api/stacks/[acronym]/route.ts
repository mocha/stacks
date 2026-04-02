import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ acronym: string }> }
) {
  const { acronym } = await params;

  const stack = await prisma.stack.findUnique({
    where: { acronym },
  });

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  // Auth check: only the stack creator can delete
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

  const body = await request.json().catch(() => ({}));

  if (body.confirmation !== "Yeah it sucks these days anyway") {
    return NextResponse.json(
      { error: "Invalid confirmation", expected: "Yeah it sucks these days anyway" },
      { status: 400 }
    );
  }

  await prisma.stack.delete({ where: { id: stack.id } });

  return NextResponse.json({ message: "Stack relinquished. The acronym is free." });
}
