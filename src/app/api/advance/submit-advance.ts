import type { NextApiRequest, NextApiResponse } from 'next';

// Ganti dengan URL Web App Anda yang sudah di-deploy.
// Sangat disarankan untuk menyimpannya di environment variable (.env.local)
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Hanya izinkan permintaan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  // Pastikan URL Apps Script sudah diatur
  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ status: 'error', message: 'Apps Script URL is not configured' });
  }

  try {
    const dataToSend = req.body;

    // Meneruskan permintaan ke Google Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(dataToSend),
    });
    
    // Memeriksa jika respons dari Apps Script berhasil
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apps Script responded with an error:', errorText);
      return res.status(response.status).json({ status: 'error', message: 'Failed to communicate with Google Apps Script.' });
    }

    const result = await response.json();
    
    // Mengembalikan respons dari Apps Script ke klien
    return res.status(200).json(result);

  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred.' });
  }
}