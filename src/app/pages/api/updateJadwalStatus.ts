// pages/api/updateJadwalStatus.ts
import type { NextApiRequest, NextApiResponse } from "next";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwtK10lWBGRcRw8I_yOFYXNQWJqXAi6k-BDkUOyYYk7gcfX5UKYZBBYQqklgASNf3Ow/exec";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const payload = {
      ...body,
      _method: "PUT",
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
