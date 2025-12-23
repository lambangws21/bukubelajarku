// pages/api/updateJadwalStatus.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwtK10lWBGRcRw8I_yOFYXNQWJqXAi6k-BDkUOyYYk7gcfX5UKYZBBYQqklgASNf3Ow/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, _method: 'PUT' }),
    });

    const resultText = await response.text();

    try {
      const result = JSON.parse(resultText);
      return res.status(200).json(result);
    } catch {
      console.error('Invalid JSON response:', resultText);
      return res.status(500).json({ error: 'Invalid response from Apps Script', detail: resultText });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error', detail: error });
  }
}
