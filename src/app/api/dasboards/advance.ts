// app/api/advance/route.ts
export async function POST(req: Request) {
    const body = await req.json();
  
    const response = await fetch('https://script.google.com/macros/s/AKfycb.../exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: response.status });
  }
  