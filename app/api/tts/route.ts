import { NextResponse } from "next/server";

// Google Translate TTS — high quality, supports Arabic/all lesson languages natively
const LANG_MAP: Record<string, string> = {
  arabic: "ar", english: "en", spanish: "es",
  french: "fr", german: "de", mandarin: "zh-CN",
  japanese: "ja", portuguese: "pt", italian: "it",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "en"; // already mapped by client

  if (!text.trim()) return NextResponse.json({ error: "No text" }, { status: 400 });

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob&ttsspeed=0.8`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });

    if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400", // cache for 24h
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}

export { LANG_MAP };
