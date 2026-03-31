import { prisma } from "@/lib/prisma";
import { fetchRepoInfo } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const technologies = await prisma.technology.findMany({
    where: { status: "approved" },
    select: { id: true, githubUrl: true },
  });

  let updated = 0;
  for (const tech of technologies) {
    const info = await fetchRepoInfo(tech.githubUrl);
    if (info) {
      await prisma.technology.update({
        where: { id: tech.id },
        data: { githubStars: info.stars },
      });
      updated++;
    }
  }

  return NextResponse.json({ updated, total: technologies.length });
}
