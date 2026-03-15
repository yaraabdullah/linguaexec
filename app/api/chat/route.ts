import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const { messages, language, level } = await req.json();

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: 3,
    timeout: 30000,
  });

  const langMap: Record<string, string> = { arabic: "Arabic", english: "English", spanish: "Spanish" };
  const targetLang = langMap[language] || language;

  const systemPrompt = `You are an expert ${targetLang} language tutor for busy executives. Your role:

1. CONVERSE primarily in ${targetLang} (appropriate for ${level} level)
2. After each message, provide a brief English translation in parentheses
3. CORRECT mistakes gently: when the user makes an error, note it with "💡 Correction:" and explain why
4. Add VOCABULARY TIPS: highlight 1-2 key words/phrases from each exchange with "📝 Note:"
5. Be encouraging, professional, and efficient — executives are busy
6. Keep responses concise (2-4 sentences in target language)
7. For beginners, use simple vocabulary. For advanced, use business/formal register
8. Occasionally offer PRONUNCIATION TIPS with "🗣️ Pronunciation:"

Always end with a follow-up question to keep conversation flowing.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 800,
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Chat stream error:", err);
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
