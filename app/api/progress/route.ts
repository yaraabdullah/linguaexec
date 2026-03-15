import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isToday } from "@/lib/topics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true,
      targetLanguage: true, nativeLanguage: true, level: true,
      goals: true, dailyMinutes: true, joinedAt: true,
      streak: true, lastActiveDate: true, wordsLearned: true,
      lessonsCompleted: true, minutesPracticed: true,
      currentLevel: true, xp: true, completedTopics: true,
      lastLessonDate: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Streak calculation
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastActive = new Date(user.lastActiveDate); lastActive.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  let streak = user.streak;
  if (lastActive.getTime() === yesterday.getTime()) {
    streak = user.streak + 1;
    await prisma.user.update({ where: { id: session.user.id }, data: { streak, lastActiveDate: new Date() } });
  } else if (lastActive.getTime() < yesterday.getTime()) {
    streak = 1;
    await prisma.user.update({ where: { id: session.user.id }, data: { streak: 1, lastActiveDate: new Date() } });
  }

  const todaysDone = user.lastLessonDate ? isToday(new Date(user.lastLessonDate)) : false;

  return NextResponse.json({ ...user, streak, todaysDone });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  if (typeof body.xp === "number") {
    const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { xp: true } });
    const newXp = (current?.xp ?? 0) + body.xp;
    updates.xp = newXp;
    updates.currentLevel = Math.floor(newXp / 500) + 1;
  }
  if (typeof body.wordsLearned === "number") updates.wordsLearned = { increment: body.wordsLearned };
  if (body.lessonCompleted) {
    updates.lessonsCompleted = { increment: 1 };
    updates.minutesPracticed = { increment: 10 };
    updates.lastLessonDate = new Date(); // mark today's lesson as done
  }
  if (body.undoDailyLesson) {
    // Undo an incorrectly-marked daily lesson (e.g. caused by old custom-session bug)
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lessonsCompleted: true, lastLessonDate: true, minutesPracticed: true },
    });
    updates.lastLessonDate = null;
    if ((current?.lessonsCompleted ?? 0) > 0) {
      updates.lessonsCompleted = { decrement: 1 };
    }
    if ((current?.minutesPracticed ?? 0) >= 10) {
      updates.minutesPracticed = { decrement: 10 };
    }
  }

  const profileFields = ["name", "targetLanguage", "nativeLanguage", "level", "goals", "dailyMinutes"];
  for (const f of profileFields) if (body[f] !== undefined) updates[f] = body[f];

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { xp: true, currentLevel: true, wordsLearned: true, lessonsCompleted: true, minutesPracticed: true },
  });

  return NextResponse.json(user);
}
