// File: pages/api/advance/advanceList.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(SCRIPT_URL);

    if (!response.ok) {
      throw new Error(`Gagal fetch data (${response.status})`);
    }

    const json = await response.json();
    const advanceItems = json?.advance?.items ?? [];

    res.status(200).json({
      status: 'success',
      data: advanceItems,
    });
  } catch (error) {
    console.error('[advanceList]', error);

    res.status(500).json({
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan pada server',
    });
  }
}
