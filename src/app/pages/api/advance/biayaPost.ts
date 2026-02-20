// pages/api/biaya/biayaPost.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec'; // Sesuaikan

export const config = {
  api: {
    // Upload bukti dalam base64 bisa melewati limit default 1mb.
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ status: 'error', message: 'Payload tidak valid' });
    }

    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const rawText = await response.text();
    let parsed: any = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        message:
          parsed?.message ||
          `Apps Script error (${response.status}).`,
        upstream:
          rawText?.slice(0, 240) || null,
      });
    }

    if (parsed && typeof parsed === 'object') {
      return res.status(200).json(parsed);
    }

    // Beberapa Apps Script mengembalikan text/plain.
    if (rawText && /success|berhasil/i.test(rawText)) {
      return res.status(200).json({ status: 'success', message: rawText });
    }

    return res.status(502).json({
      status: 'error',
      message: 'Response dari Apps Script tidak valid',
      upstream: rawText?.slice(0, 240) || null,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
