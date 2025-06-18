import type { NextApiRequest, NextApiResponse } from 'next';

const ADVANCE_URL = "https://script.google.com/macros/s/AKfycbw5ACQflrxjlsoY_ZvjZQs7Xd8f2lFnzNjOtXPLW_xx3bHb8TNK02VX0ghXLbE7QDnF/exec";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'PUT') {
    try {
      const body = req.body;

      const response = await fetch(ADVANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodOverride: 'PUT', ...body }),
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
        body: JSON.stringify({ methodOverride: 'DELETE', no }),
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
