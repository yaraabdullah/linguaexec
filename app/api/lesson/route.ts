import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { language, level, topic } = await req.json();

  const langMap: Record<string, string> = { arabic: "Arabic", english: "English", spanish: "Spanish" };
  const targetLang = langMap[language] || language;

  const prompt = `You are an expert language teacher for busy executives. Create a concise, practical ${targetLang} lesson for a ${level} learner on the topic: "${topic}".

Structure your lesson as valid JSON with this exact format:
{
  "title": "Lesson title",
  "subtitle": "Brief description",
  "vocabulary": [
    {"word": "word in target language", "pronunciation": "phonetic guide", "translation": "English translation", "example": "example sentence"}
  ],
  "phrases": [
    {"phrase": "useful phrase", "pronunciation": "phonetic guide", "translation": "English translation", "usage": "when to use this"}
  ],
  "grammar": {
    "rule": "one key grammar point",
    "explanation": "simple explanation",
    "examples": ["example 1", "example 2"]
  },
  "culturalTip": "one relevant business/cultural insight",
  "quiz": [
    {"question": "quiz question", "options": ["A", "B", "C", "D"], "pronunciations": ["romanization-A", "romanization-B", "romanization-C", "romanization-D"], "correct": 0, "explanation": "why this is correct"}
  ]
}

Keep vocabulary to 6 items, phrases to 4 items, quiz to 3 questions. Make content executive-relevant and practical.
IMPORTANT: For the quiz "pronunciations" field, provide the romanized pronunciation for each option so learners who don't read the script can still understand the choices. Return ONLY valid JSON, no markdown.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("No text response");

    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    }

    const lessonData = JSON.parse(jsonText);
    return Response.json(lessonData);
  } catch (err) {
    console.error("Lesson generation error:", err);
    return Response.json({ error: "Failed to generate lesson" }, { status: 500 });
  }
}
