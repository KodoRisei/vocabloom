-- CreateEnum
CREATE TYPE "QuizItemStatus" AS ENUM ('PENDING', 'ACTIVE', 'CORRECT');

-- AlterTable: add window_size to quiz_sessions
ALTER TABLE "quiz_sessions" ADD COLUMN "window_size" INTEGER NOT NULL DEFAULT 5;

-- AlterTable: add new columns to quiz_session_items with defaults for existing rows
ALTER TABLE "quiz_session_items"
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "status" "QuizItemStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "displayed_at" TIMESTAMPTZ;

-- Set position for existing rows based on insertion order within each session
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY id) - 1 AS pos
  FROM quiz_session_items
)
UPDATE quiz_session_items
SET position = ranked.pos
FROM ranked
WHERE quiz_session_items.id = ranked.id;

-- Set CORRECT status for items that were already answered correctly
UPDATE quiz_session_items
SET status = 'CORRECT'
WHERE is_correct = true;

-- Set ACTIVE for remaining answered/in-progress items
UPDATE quiz_session_items
SET status = 'ACTIVE'
WHERE is_correct IS NULL AND status = 'PENDING';

-- CreateIndex: unique constraint on (session_id, position)
CREATE UNIQUE INDEX "quiz_session_items_session_id_position_key"
  ON "quiz_session_items"("session_id", "position");

-- CreateIndex: case-insensitive unique index on english_expression
CREATE UNIQUE INDEX "vocabularies_english_ci_uq"
  ON "vocabularies" (lower("english_expression"));
