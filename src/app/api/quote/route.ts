import { NextResponse } from 'next/server';

// Fungsi helper untuk menerjemahkan teks (tetap sama)
async function translateText(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|id`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation API request failed');
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Kembalikan teks asli jika terjemahan gagal
  }
}

export async function GET() {
  try {
    // 1. Ambil kutipan acak dalam Bahasa Inggris dari ZenQuotes
    const response = await fetch('https://zenquotes.io/api/random', {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data dari ZenQuotes: ${response.statusText}`);
    }

    const data = await response.json();
    const originalQuote = data[0]; // { q: 'Quote text', a: 'Author' }

    // 2. Terjemahkan kutipan ke Bahasa Indonesia
    const translatedContent = await translateText(originalQuote.q);

    // 3. Siapkan hasil dengan kedua versi bahasa
    const result = {
      content_en: originalQuote.q,      // Versi Inggris
      content_id: translatedContent,    // Versi Indonesia
      author: originalQuote.a,
    };

    // 4. Kirim hasil sebagai JSON
    return NextResponse.json(result);

  } catch (error) {
    console.error('[API_QUOTE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}