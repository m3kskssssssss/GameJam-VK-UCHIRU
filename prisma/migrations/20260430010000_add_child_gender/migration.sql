-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('BOY', 'GIRL');

-- AlterTable
ALTER TABLE "Child" ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'BOY';
