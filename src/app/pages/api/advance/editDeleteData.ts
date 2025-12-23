import type { NextApiRequest, NextApiResponse } from 'next';

const ADVANCE_URL = "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'PUT') {
    try {
      const {
        no,
        tanggal,
        jumlah,
        jenisBiaya,
        keterangan,
        klaimOleh,
        sheet = 'Sheet1',
      } = req.body;

      // Kirim langsung ke Apps Script tanpa modifikasi tanggal
      const response = await fetch(ADVANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methodOverride: 'PUT',
          no,
          date: tanggal, // sesuai key di App Script untuk Sheet1
          jumlah,
          jenisBiaya,
          keterangan,
          klaimOleh,
          sheet,
        }),
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
      const { no, sheet = 'Sheet1' } = req.body;

      const response = await fetch(ADVANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methodOverride: 'DELETE',
          no,
          sheet,
        }),
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
