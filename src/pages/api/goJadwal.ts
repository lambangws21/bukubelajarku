// pages/api/goJadwal.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwtK10lWBGRcRw8I_yOFYXNQWJqXAi6k-BDkUOyYYk7gcfX5UKYZBBYQqklgASNf3Ow/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        return res.status(200).json(data);
      }

      case 'POST': {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const result = await response.json();
        return res.status(200).json(result);
      }

      case 'PUT': {
        const response = await fetch(SCRIPT_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const result = await response.json();
        return res.status(200).json(result);
      }

      case 'DELETE': {
        const { id } = req.query;
        const response = await fetch(`${SCRIPT_URL}?id=${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        return res.status(200).json(result);
      }

      default:
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
}
