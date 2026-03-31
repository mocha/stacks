-- CreateEnum
CREATE TYPE "TechnologyStatus" AS ENUM ('approved', 'pending', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUsername" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "profileUrl" TEXT NOT NULL,
    "hasStack" BOOLEAN NOT NULL DEFAULT false,
    "githubData" JSONB,
    "githubDataSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supabaseAuthId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "githubUrl" TEXT NOT NULL,
    "githubStars" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT,
    "status" "TechnologyStatus" NOT NULL DEFAULT 'pending',
    "discoveredById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stack" (
    "id" UUID NOT NULL,
    "acronym" TEXT NOT NULL,
    "creatorId" UUID NOT NULL,
    "questionnaire" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "rerollsToday" INTEGER NOT NULL DEFAULT 0,
    "lastRerollDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackTechnology" (
    "stackId" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "StackTechnology_pkey" PRIMARY KEY ("stackId","technologyId")
);

-- CreateTable
CREATE TABLE "HallOfFame" (
    "id" UUID NOT NULL,
    "stackId" UUID NOT NULL,
    "pickedOn" DATE NOT NULL,

    CONSTRAINT "HallOfFame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerUsername_key" ON "User"("provider", "providerUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_slug_key" ON "Technology"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Stack_acronym_key" ON "Stack"("acronym");

-- CreateIndex
CREATE UNIQUE INDEX "Stack_creatorId_key" ON "Stack"("creatorId");

-- AddForeignKey
ALTER TABLE "Technology" ADD CONSTRAINT "Technology_discoveredById_fkey" FOREIGN KEY ("discoveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stack" ADD CONSTRAINT "Stack_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackTechnology" ADD CONSTRAINT "StackTechnology_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackTechnology" ADD CONSTRAINT "StackTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallOfFame" ADD CONSTRAINT "HallOfFame_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
