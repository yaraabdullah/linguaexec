import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { situation } = await req.json();
  if (!situation?.trim()) return NextResponse.json({ error: "No situation provided" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { targetLanguage: true, level: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const prompt = `You are a language coach. A user learning ${user.targetLanguage} at ${user.level} level described this real-life situation:

"${situation}"

Give them 3–4 natural, ready-to-use responses they can say in ${user.targetLanguage}.
Vary the tone: include at least one formal and one casual option where appropriate.
Each response should feel natural and authentic — like what a native speaker would actually say.

Return ONLY valid JSON, no markdown, in this exact format:
{
  "situationSummary": "one-sentence summary of the situation",
  "responses": [
    {
      "phrase": "the phrase in ${user.targetLanguage}",
      "pronunciation": "romanized pronunciation guide",
      "translation": "English translation",
      "tone": "Formal | Casual | Polite | Friendly",
      "note": "one sentence on when/why to use this"
    }
  ],
  "culturalTip": "optional cultural insight relevant to this situation, or empty string"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const data = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(data);
  } catch (err) {
    console.error("what-to-say error", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
