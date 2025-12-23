// File: pages/api/advance.ts
// Menggunakan Pages Router. Jika Anda menggunakan App Router, lihat catatan di bawah.

import type { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const body = req.body;

    // Tambahkan log untuk debugging
    console.log('Meneruskan ke Apps Script:', body);

    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Penting untuk Apps Script
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      return res.status(500).json({ message: result.message || 'Failed to process request on Apps Script.' });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}