import { prisma } from "@/lib/prisma";
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
