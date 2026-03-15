import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET: fetch all saved words for the user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const words = await prisma.savedWord.findMany({
    where: { userId: session.user.id },
    orderBy: { learnedAt: "desc" },
  });

  return NextResponse.json(words);
}

// POST: save words/phrases from a completed lesson
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { words, topic, language } = await req.json();
  if (!Array.isArray(words) || !language) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Upsert each word (skip duplicates)
  const results = await Promise.allSettled(
    words.map((w: { word: string; pronunciation: string; translation: string; example?: string; type?: string }) =>
      prisma.savedWord.upsert({
        where: { userId_word_language: { userId: session.user!.id!, word: w.word, language } },
        update: {}, // don't overwrite existing entries
        create: {
          userId: session.user!.id!,
          word: w.word,
          pronunciation: w.pronunciation || "",
          translation: w.translation || "",
          example: w.example || "",
          language,
          type: w.type || "word",
          topic: topic || "",
        },
      })
    )
  );

  const saved = results.filter(r => r.status === "fulfilled").length;
  return NextResponse.json({ saved });
}

// PATCH: mark a topic as completed for the user
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic } = await req.json();
  if (!topic) return NextResponse.json({ error: "No topic" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { completedTopics: true },
  });

  const updated = Array.from(new Set([...(user?.completedTopics ?? []), topic]));

  await prisma.user.update({
    where: { id: session.user.id },
    data: { completedTopics: updated },
  });

  return NextResponse.json({ completedTopics: updated });
}
