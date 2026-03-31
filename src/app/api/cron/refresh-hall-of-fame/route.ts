import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.hallOfFame.deleteMany({
    where: { pickedOn: { lt: today } },
  });

  const existing = await prisma.hallOfFame.count({
    where: { pickedOn: today },
  });

  if (existing >= 5) {
    return NextResponse.json({ message: "Already picked for today", count: existing });
  }

  const randomStacks = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Stack" ORDER BY RANDOM() LIMIT 5
  `;

  for (const stack of randomStacks) {
    await prisma.hallOfFame.create({
      data: {
        stackId: stack.id,
        pickedOn: today,
      },
    });
  }

  return NextResponse.json({ message: "Hall of Fame refreshed", count: randomStacks.length });
}
