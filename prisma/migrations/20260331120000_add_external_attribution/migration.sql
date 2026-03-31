-- Make creatorId nullable for canonical stacks
ALTER TABLE "Stack" ALTER COLUMN "creatorId" DROP NOT NULL;

-- Add external attribution for canonical stacks
ALTER TABLE "Stack" ADD COLUMN "externalAttribution" JSONB;
