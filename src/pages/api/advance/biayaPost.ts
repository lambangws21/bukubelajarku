// pages/api/biaya/biayaPost.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5ACQflrxjlsoY_ZvjZQs7Xd8f2lFnzNjOtXPLW_xx3bHb8TNK02VX0ghXLbE7QDnF/exec'; // Sesuaikan

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
