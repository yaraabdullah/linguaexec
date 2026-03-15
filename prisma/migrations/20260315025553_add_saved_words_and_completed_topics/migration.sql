-- AlterTable
ALTER TABLE "User" ADD COLUMN     "completedTopics" TEXT[];

-- CreateTable
CREATE TABLE "SavedWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pronunciation" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "example" TEXT,
    "language" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'word',
    "topic" TEXT NOT NULL DEFAULT '',
    "learnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedWord_userId_word_language_key" ON "SavedWord"("userId", "word", "language");

-- AddForeignKey
ALTER TABLE "SavedWord" ADD CONSTRAINT "SavedWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
