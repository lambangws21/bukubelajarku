// File: pages/api/stock/[sheet].ts

import type { NextApiRequest, NextApiResponse } from 'next';

// Ganti URL berikut dengan URL Web App kamu yang mendukung PUT
const BASE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzem39PAWzjAIsRZg-m17LB_ufa6_qu3e20SqtYSAeCW7Vg6nk2ZqdgMVk3B_0mGBKJ/exec';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sheet } = req.query;
  if (typeof sheet !== 'string') {
    res.status(400).json({ error: 'Query param `sheet` is required' });
    return;
  }

  try {
    if (req.method === 'GET') {
      // Build URL with query for GET
      const query = new URLSearchParams({ sheet, ...(req.query.search ? { search: req.query.search as string } : {}) });
      const scriptUrl = `${BASE_SCRIPT_URL}?${query.toString()}`;

      const apiRes = await fetch(scriptUrl, { method: 'GET' });
      const data = await apiRes.text();

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(apiRes.status).send(data);

    } else if (req.method === 'PUT') {
      // PUT for update: merge sheet into body
      const payload = { ...(typeof req.body === 'object' ? req.body : {}), sheet, action: 'update' };
      const apiRes = await fetch(BASE_SCRIPT_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await apiRes.text();

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(apiRes.status).send(data);

    } else {
      // Method not allowed
      res.setHeader('Allow', 'GET,PUT');
      res.status(405).end();
    }
  } catch (error: any) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}