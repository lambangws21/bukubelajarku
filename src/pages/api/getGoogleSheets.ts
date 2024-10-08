import type { NextApiRequest, NextApiResponse } from 'next';

// URL dari endpoint Google Apps Script
const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxbRc0lxJKMIkduQKDtb-f-oeUJF8h5QaeHKk68tVFViSQIvUDn1rAmkDYXIsacnBv5Eg/exec';

// Definisi tipe data respons untuk setiap item
type SheetDataItem = {
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

// Definisi tipe data respons API
type ResponseData = {
  data?: SheetDataItem[];
  error?: string;
  status?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
): Promise<void> {
  try {
    if (req.method === 'GET') {
      const response = await fetch(GOOGLE_SCRIPT_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Apps Script');
      }

      const result = await response.json();

      // Pastikan data yang diterima dari Google Apps Script adalah array
      if (result && Array.isArray(result.data)) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ data: result.data }); // Pastikan kita mengembalikan data dalam format yang diharapkan
      } else {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ error: 'Unexpected data format received from Google Apps Script.' });
      }
    } else if (req.method === 'POST') {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body), // Mengirimkan data yang diterima dari form
      });

      if (!response.ok) {
        throw new Error('Failed to post data to Google Apps Script');
      }

      const data: { status: string } = await response.json();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ status: data.status });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
