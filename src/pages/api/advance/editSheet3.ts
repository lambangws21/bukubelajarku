// pages/api/advance/editDeleteData.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const ADVANCE_URL = "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'PUT') {
    try {
      const body = req.body;

      // Pastikan sheet diarahkan ke Sheet3
      const response = await fetch(ADVANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodOverride: 'PUT', sheet: 'Sheet3', ...body }),
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('❌ Error PUT:', error);
      return res.status(500).json({ status: 'error', message: String(error) });
    }
  }

  if (method === 'DELETE') {
    try {
      const { no } = req.body;

      const response = await fetch(ADVANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodOverride: 'DELETE', sheet: 'Sheet3', no }),
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('❌ Error DELETE:', error);
      return res.status(500).json({ status: 'error', message: String(error) });
    }
  }

  return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
}
