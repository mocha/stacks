import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    if (query) {
      const technologies = await prisma.$queryRaw`
        SELECT id, name, vendor, slug, description, "logoUrl", "githubStars"
        FROM "Technology"
        WHERE status = 'approved'
          AND name ILIKE ${query + '%'}
        ORDER BY name ASC
        LIMIT 20
      `;
      return NextResponse.json(technologies);
    }

    const technologies = await prisma.technology.findMany({
      where: { status: "approved" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        vendor: true,
        slug: true,
        description: true,
        logoUrl: true,
        githubStars: true,
      },
      take: 20,
    });

    return NextResponse.json(technologies);
  } catch (error) {
    console.error("Technologies API error:", error);
    return NextResponse.json({ error: "Failed to search technologies" }, { status: 500 });
  }
}
