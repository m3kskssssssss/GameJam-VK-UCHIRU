-- Migration: add_child_quest_flags
-- Adds: questFlags JSONB column on Child (stores per-child quest progress
-- flags: talk events, lobby plays counter, etc.). Default empty object so
-- existing rows are valid without backfill.

ALTER TABLE "Child"
  ADD COLUMN "questFlags" JSONB NOT NULL DEFAULT '{}'::jsonb;
