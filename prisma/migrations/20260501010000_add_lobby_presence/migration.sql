-- CreateTable
CREATE TABLE "LobbyPresence" (
    "childId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'BOY',
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "z" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyPresence_pkey" PRIMARY KEY ("childId")
);

-- CreateIndex
CREATE INDEX "LobbyPresence_lastHeartbeatAt_idx" ON "LobbyPresence"("lastHeartbeatAt");
