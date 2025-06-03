// File: /pages/api/postCase.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// URL Web App Google Apps Script untuk doPost()
const APPSCRIPT_URL = process.env.NEXT_PUBLIC_APPSCRIPT_URL!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Hanya mengizinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Pastikan body JSON berisi field yang dibutuhkan: title, note, base64Image, fileName, mimeType (opsional)
    const { title, note, base64Image, fileName, mimeType } = req.body;
    if (!title || !note || !base64Image || !fileName) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Forward request dengan method POST ke Apps Script
    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, note, base64Image, fileName, mimeType }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Apps Script returned status ${response.status}: ${text}`);
    }

    const json = await response.json();
    return res.status(200).json(json);
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
