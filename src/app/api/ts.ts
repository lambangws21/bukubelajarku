import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const scriptUrl = "https://script.google.com/macros/s/AKfycbw5KxMn7OLci-nZ2WhYNObGKlyHexKj23nrsqC0uUm3QEtLZfcC33Qpye7atnGPQbzC/exec"; // Ganti dengan URL Apps Script kamu

  if (req.method === "GET") {
    const response = await fetch(`${scriptUrl}?sheet=TS`);
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const result = await response.json();
    return res.status(200).json(result);
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
