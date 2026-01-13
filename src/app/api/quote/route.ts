import { NextResponse } from "next/server";

const fallbackQuotes = [
  {
    q: "Progress is better than perfection.",
    a: "Mark Twain",
  },
  {
    q: "The best way to predict the future is to create it.",
    a: "Peter Drucker",
  },
  {
    q: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    a: "Winston Churchill",
  },
];

// Fungsi helper untuk menerjemahkan teks (tetap sama)
async function translateText(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|id`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Translation API request failed");
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Kembalikan teks asli jika terjemahan gagal
  }
}

const getFallbackQuote = () =>
  fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

export async function GET() {
  let originalQuote = getFallbackQuote();

  try {
    const response = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 0 },
    });

    if (response.ok) {
      const data = await response.json();
      originalQuote = data[0];
    } else {
      const message = `Gagal mengambil data dari ZenQuotes: ${response.statusText}`;
      console.warn("[API_QUOTE_WARN]", message);
    }
  } catch (error) {
    console.error("[API_QUOTE_ERROR] fetch failed", error);
  }

  const translatedContent = await translateText(originalQuote.q);

  const result = {
    content_en: originalQuote.q,
    content_id: translatedContent,
    author: originalQuote.a,
  };

  return NextResponse.json(result);
}
