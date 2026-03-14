import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { messages, language, level, scenario } = await req.json();

  const langMap: Record<string, string> = { arabic: "Arabic", english: "English", spanish: "Spanish" };
  const targetLang = langMap[language] || language;

  const systemPrompt = `You are playing a role in a ${targetLang} business scenario for an executive learner.

Scenario: ${scenario.title}
Your role: ${scenario.aiRole}
Context: ${scenario.context}

RULES:
1. Stay in character as ${scenario.aiRole} throughout
2. Speak primarily in ${targetLang} (${level} level vocabulary)
3. Add English translation in [brackets] after key phrases
4. React realistically to what the user says in the scenario
5. After each exchange, add ONE coaching tip prefixed with "🎯 Coach:"
6. Be professional and business-appropriate
7. If the user makes a language error, gently correct with "✏️ Fix:"
8. Keep responses to 3-5 sentences

Help the executive practice real-world ${targetLang} business communication.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = await client.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 600,
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        });

        for await (const event of apiStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Scenario stream error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
