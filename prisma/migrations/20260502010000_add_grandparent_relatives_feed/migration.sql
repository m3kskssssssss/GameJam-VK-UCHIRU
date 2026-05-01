-- Migration: add_grandparent_relatives_feed
-- Adds: enum Grandparent, Role.RELATIVE, avatarUrl/avatarKey on Parent/Child,
--        models Relative, GrandparentTaskCompletion, FeedPost, FeedComment, FeedLike.

-- ---------------------------------------------------------------------------
-- 1. New enum: Grandparent
-- ---------------------------------------------------------------------------
-- CreateEnum
CREATE TYPE "Grandparent" AS ENUM ('GRANDMA', 'GRANDPA');

-- ---------------------------------------------------------------------------
-- 2. Extend enum Role with RELATIVE (append-only — existing ordinals unchanged)
-- ---------------------------------------------------------------------------
ALTER TYPE "Role" ADD VALUE 'RELATIVE';

-- ---------------------------------------------------------------------------
-- 3. Add optional avatar fields to Parent
-- ---------------------------------------------------------------------------
ALTER TABLE "Parent"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "avatarKey" TEXT;

-- ---------------------------------------------------------------------------
-- 4. Add optional avatar fields to Child
-- ---------------------------------------------------------------------------
ALTER TABLE "Child"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "avatarKey" TEXT;

-- ---------------------------------------------------------------------------
-- 5. New table: Relative
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE "Relative" (
    "id"           TEXT NOT NULL,
    "username"     TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName"  TEXT NOT NULL,
    "avatarUrl"    TEXT,
    "avatarKey"    TEXT,
    "parentId"     TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Relative_username_key" ON "Relative"("username");

-- Index reason: listRelatives queries by parentId; parent manages their relatives list.
-- CreateIndex
CREATE INDEX "Relative_parentId_idx" ON "Relative"("parentId");

-- AddForeignKey
ALTER TABLE "Relative"
  ADD CONSTRAINT "Relative_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. New table: GrandparentTaskCompletion
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE "GrandparentTaskCompletion" (
    "id"           TEXT NOT NULL,
    "childId"      TEXT NOT NULL,
    "grandparent"  "Grandparent" NOT NULL,
    "taskKey"      TEXT NOT NULL,
    "taskName"     TEXT NOT NULL,
    "photoUrl"     TEXT NOT NULL,
    "photoKey"     TEXT NOT NULL,
    "coinsEarned"  INTEGER NOT NULL,
    "energyEarned" INTEGER NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrandparentTaskCompletion_pkey" PRIMARY KEY ("id")
);

-- Unique reason: one submission per task per child (re-submission updates via upsert).
-- CreateIndex
CREATE UNIQUE INDEX "GrandparentTaskCompletion_childId_taskKey_key"
  ON "GrandparentTaskCompletion"("childId", "taskKey");

-- Index reason: parent dashboard groups by grandparent + child, ordered by createdAt.
-- CreateIndex
CREATE INDEX "GrandparentTaskCompletion_childId_grandparent_createdAt_idx"
  ON "GrandparentTaskCompletion"("childId", "grandparent", "createdAt");

-- AddForeignKey
ALTER TABLE "GrandparentTaskCompletion"
  ADD CONSTRAINT "GrandparentTaskCompletion_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. New table: FeedPost
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE "FeedPost" (
    "id"           TEXT NOT NULL,
    "parentId"     TEXT NOT NULL,
    "childId"      TEXT NOT NULL,
    "kind"         TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "photoUrl"     TEXT,
    "photoKey"     TEXT,
    "rewardCoins"  INTEGER NOT NULL DEFAULT 0,
    "rewardEnergy" INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- Index reason: primary feed query — by parentId ordered by createdAt desc.
-- CreateIndex
CREATE INDEX "FeedPost_parentId_createdAt_idx" ON "FeedPost"("parentId", "createdAt");

-- Index reason: child-specific filter in feed (parent filtering by one child).
-- CreateIndex
CREATE INDEX "FeedPost_childId_createdAt_idx" ON "FeedPost"("childId", "createdAt");

-- AddForeignKey
ALTER TABLE "FeedPost"
  ADD CONSTRAINT "FeedPost_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost"
  ADD CONSTRAINT "FeedPost_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 8. New table: FeedComment
--    No hard FK on authorId — uses authorType + authorId string pattern to
--    avoid polymorphic FK complexity across Parent and Relative tables.
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE "FeedComment" (
    "id"         TEXT NOT NULL,
    "postId"     TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId"   TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- Index reason: getPostDetail loads comments for a post ordered by createdAt.
-- CreateIndex
CREATE INDEX "FeedComment_postId_createdAt_idx" ON "FeedComment"("postId", "createdAt");

-- Index reason: allows finding all comments by a given author (e.g. scrub on delete).
-- CreateIndex
CREATE INDEX "FeedComment_authorType_authorId_idx" ON "FeedComment"("authorType", "authorId");

-- AddForeignKey
ALTER TABLE "FeedComment"
  ADD CONSTRAINT "FeedComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 9. New table: FeedLike
--    Same authorType + authorId pattern as FeedComment — no polymorphic FK.
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE "FeedLike" (
    "id"         TEXT NOT NULL,
    "postId"     TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId"   TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("id")
);

-- Unique reason: one like per (post, author) — enforces toggleLike semantics.
-- CreateIndex
CREATE UNIQUE INDEX "FeedLike_postId_authorType_authorId_key"
  ON "FeedLike"("postId", "authorType", "authorId");

-- Index reason: count likes per post in feed list query.
-- CreateIndex
CREATE INDEX "FeedLike_postId_idx" ON "FeedLike"("postId");

-- AddForeignKey
ALTER TABLE "FeedLike"
  ADD CONSTRAINT "FeedLike_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
