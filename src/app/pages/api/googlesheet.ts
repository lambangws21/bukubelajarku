import type { NextApiRequest, NextApiResponse } from 'next';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwo9DciEZFVw1wbsE9ROsoF1l5ZfC05UG5b1O2hFS-cqgmvnkOXSdCLQ2PiQPauCdLsTQ/exec';

type SheetDataItem = { 
  id?: number; 
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

type ResponseData = {
  data?: SheetDataItem[];
  error?: string;
  status?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store'); // Pastikan tidak ada data yang di-cache
  try {
    if (req.method === 'GET') {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Apps Script');
      }

      const result = await response.json();
      if (!Array.isArray(result.data)) {
        throw new Error('Invalid data format received from Google Apps Script');
      }
      res.status(200).json({ data: result.data });
    } else if (req.method === 'POST') {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error('Failed to post data to Google Apps Script');
      }

      const data: { status: string } = await response.json();
      res.status(200).json({ status: data.status });
    } else if (req.method === 'PUT') {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error('Failed to update data on Google Apps Script');
      }

      const data: { status: string } = await response.json();
      res.status(200).json({ status: data.status });
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        throw new Error('ID is required to delete data');
      }

      const response = await fetch(`${GOOGLE_SCRIPT_URL}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete data from Google Apps Script');
      }

      const data: { status: string } = await response.json();
      res.status(200).json({ status: data.status });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
