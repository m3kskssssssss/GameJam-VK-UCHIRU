-- CreateTable
CREATE TABLE "LobbyMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "startedAt" DATETIME,
    "endsAt" DATETIME,
    "lastSpawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LobbyPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 6,
    "y" INTEGER NOT NULL DEFAULT 4,
    "score" INTEGER NOT NULL DEFAULT 0,
    "lastMoveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LobbyPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "LobbyMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LobbyTile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "stompedById" TEXT,
    "spawnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stompedAt" DATETIME,
    CONSTRAINT "LobbyTile_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "LobbyMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LobbyMatch_status_createdAt_idx" ON "LobbyMatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LobbyPlayer_matchId_idx" ON "LobbyPlayer"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyPlayer_matchId_childId_key" ON "LobbyPlayer"("matchId", "childId");

-- CreateIndex
CREATE INDEX "LobbyTile_matchId_stompedById_idx" ON "LobbyTile"("matchId", "stompedById");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyTile_matchId_x_y_key" ON "LobbyTile"("matchId", "x", "y");
