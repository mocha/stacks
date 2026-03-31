import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const technologies = await prisma.technology.findMany({
    where: {
      status: "approved",
      ...(query
        ? { name: { contains: query, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      githubStars: true,
    },
    take: 20,
  });

  return NextResponse.json(technologies);
}
