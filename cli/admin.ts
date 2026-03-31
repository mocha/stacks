import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listPending() {
  const pending = await prisma.technology.findMany({
    where: { status: "pending" },
    include: { discoveredBy: { select: { providerUsername: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (pending.length === 0) {
    console.log("No pending technology suggestions.");
    return;
  }

  console.log(`\n${pending.length} pending suggestion(s):\n`);
  for (const tech of pending) {
    console.log(`  [${tech.id}]`);
    console.log(`    Name:        ${tech.name}`);
    console.log(`    URL:         ${tech.githubUrl}`);
    console.log(`    Language:    ${tech.language ?? "unknown"}`);
    console.log(`    Stars:       ${tech.githubStars}`);
    console.log(`    Suggested by: @${tech.discoveredBy?.providerUsername ?? "unknown"}`);
    console.log(`    Date:        ${tech.createdAt.toISOString()}`);
    console.log();
  }
}

async function approve(id: string) {
  const tech = await prisma.technology.update({
    where: { id },
    data: { status: "approved" },
  });
  console.log(`Approved: ${tech.name} (${tech.slug})`);
}

async function reject(id: string) {
  const tech = await prisma.technology.update({
    where: { id },
    data: { status: "rejected" },
  });
  console.log(`Rejected: ${tech.name}`);
}

async function main() {
  const [command, arg] = process.argv.slice(2);

  switch (command) {
    case "list":
      await listPending();
      break;
    case "approve":
      if (!arg) {
        console.error("Usage: admin approve <technology-id>");
        process.exit(1);
      }
      await approve(arg);
      break;
    case "reject":
      if (!arg) {
        console.error("Usage: admin reject <technology-id>");
        process.exit(1);
      }
      await reject(arg);
      break;
    default:
      console.log("Stacklist Admin CLI");
      console.log("  list              — show pending technology suggestions");
      console.log("  approve <id>      — approve a technology");
      console.log("  reject <id>       — reject a technology");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
