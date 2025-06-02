import { NextResponse } from "next/server";

const GAS_URL =
"https://script.google.com/macros/s/AKfycby9tPiT3Pt7t2rx2g85Q-CxZfiZi131Z7EU9OAql-y81HFNcyGfEKlpA7dv9l79f3yn/exec?getImages=true";

  export async function GET(_req: Request) {
    try {
      const response = await fetch(GAS_URL);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Unexpected response (GET images):", textResponse);
        return NextResponse.json({ error: "API did not return JSON" }, { status: 500 });
      }
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      console.error("Error fetching images:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }
  
