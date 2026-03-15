import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, targetLanguage: true, currentLevel: true, xp: true, streak: true },
    orderBy: { xp: "desc" },
    take: 100,
  });

  return NextResponse.json({ users, currentUserId: session.user.id });
}
