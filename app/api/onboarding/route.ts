import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, targetLanguage, nativeLanguage, level, goals, dailyMinutes } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name, targetLanguage, nativeLanguage: nativeLanguage || "English",
      level, goals, dailyMinutes,
      joinedAt: new Date(),
      streak: 1, lastActiveDate: new Date(),
      wordsLearned: 0, lessonsCompleted: 0,
      minutesPracticed: 0, currentLevel: 1, xp: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
