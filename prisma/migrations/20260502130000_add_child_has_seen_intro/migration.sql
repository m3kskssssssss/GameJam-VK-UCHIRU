-- Migration: add_child_has_seen_intro
-- Adds: hasSeenIntro Boolean on Child (gates the welcome video shown on
-- first login). Defaults to false so existing rows are valid; new children
-- will see the video once and the flag flips to true on completion / skip.

ALTER TABLE "Child"
  ADD COLUMN "hasSeenIntro" BOOLEAN NOT NULL DEFAULT false;
