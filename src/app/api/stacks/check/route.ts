import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const acronym = searchParams.get("acronym");

  if (!acronym) {
    return NextResponse.json(
      { error: "acronym parameter is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.stack.findUnique({
    where: { acronym },
    select: {
      acronym: true,
      creator: {
        select: { providerUsername: true },
      },
    },
  });

  return NextResponse.json({
    available: !existing,
    ...(existing && {
      existingStack: {
        acronym: existing.acronym,
        creator: existing.creator?.providerUsername ?? "canonical",
      },
    }),
  });
}
