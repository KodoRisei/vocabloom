-- CreateEnum
CREATE TYPE "QuizSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" UUID NOT NULL,
    "english_expression" VARCHAR(500) NOT NULL,
    "japanese_translation" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_records" (
    "id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "priority_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "last_answered_at" TIMESTAMP(3),
    "last_correct_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_sessions" (
    "id" UUID NOT NULL,
    "question_count" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "status" "QuizSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_session_items" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "is_correct" BOOLEAN,
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "quiz_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocabularies_created_at_idx" ON "vocabularies"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "learning_records_vocabulary_id_key" ON "learning_records"("vocabulary_id");

-- CreateIndex
CREATE INDEX "learning_records_priority_score_idx" ON "learning_records"("priority_score" DESC);

-- CreateIndex
CREATE INDEX "quiz_sessions_started_at_idx" ON "quiz_sessions"("started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_session_items_session_id_vocabulary_id_key" ON "quiz_session_items"("session_id", "vocabulary_id");

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session_items" ADD CONSTRAINT "quiz_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session_items" ADD CONSTRAINT "quiz_session_items_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
