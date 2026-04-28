-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATH', 'READING', 'ENGLISH', 'PE');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('FURNITURE', 'OUTFIT_HAIR', 'OUTFIT_TOP', 'OUTFIT_BOTTOM', 'PET');

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "homeLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubjectProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "completedLevels" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SubjectProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "level" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "energyEarned" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PESession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "photo10sUrl" TEXT,
    "photo10sKey" TEXT,
    "photo60sUrl" TEXT,
    "photo60sKey" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "energyEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PESession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Room_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomPlacement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RoomPlacement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "catalogKey" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "ownedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryItem_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AddForeignKey
ALTER TABLE "RoomPlacement"
ADD CONSTRAINT "RoomPlacement_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CharacterAppearance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "hair" TEXT NOT NULL DEFAULT 'hair_default',
    "top" TEXT NOT NULL DEFAULT 'top_default',
    "bottom" TEXT NOT NULL DEFAULT 'bottom_default',
    "petKey" TEXT,
    CONSTRAINT "CharacterAppearance_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Parent_email_key" ON "Parent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Child_username_key" ON "Child"("username");

-- CreateIndex
CREATE INDEX "Child_parentId_idx" ON "Child"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectProgress_childId_subject_key" ON "SubjectProgress"("childId", "subject");

-- CreateIndex
CREATE INDEX "TaskAttempt_childId_subject_createdAt_idx" ON "TaskAttempt"("childId", "subject", "createdAt");

-- CreateIndex
CREATE INDEX "PESession_childId_createdAt_idx" ON "PESession"("childId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Room_childId_index_key" ON "Room"("childId", "index");

-- CreateIndex
CREATE INDEX "RoomPlacement_roomId_idx" ON "RoomPlacement"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlacement_itemId_key" ON "RoomPlacement"("itemId");

-- CreateIndex
CREATE INDEX "InventoryItem_childId_category_idx" ON "InventoryItem"("childId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterAppearance_childId_key" ON "CharacterAppearance"("childId");
