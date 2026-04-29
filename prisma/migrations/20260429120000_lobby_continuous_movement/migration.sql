-- Switch lobby player coordinates to continuous (DOUBLE PRECISION) so the
-- arena can use a smooth 3D world instead of grid-step movement.

ALTER TABLE "LobbyPlayer"
  ALTER COLUMN "x" DROP DEFAULT;

ALTER TABLE "LobbyPlayer"
  ALTER COLUMN "y" DROP DEFAULT;

ALTER TABLE "LobbyPlayer"
  ALTER COLUMN "x" TYPE DOUBLE PRECISION USING "x"::DOUBLE PRECISION;

ALTER TABLE "LobbyPlayer"
  ALTER COLUMN "y" TYPE DOUBLE PRECISION USING "y"::DOUBLE PRECISION;

ALTER TABLE "LobbyPlayer"
  ALTER COLUMN "x" SET DEFAULT 0;

ALTER TABLE "LobbyPlayer"
  ALTER COLUMN "y" SET DEFAULT 0;
