// File: pages/api/advance/advanceList.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5ACQflrxjlsoY_ZvjZQs7Xd8f2lFnzNjOtXPLW_xx3bHb8TNK02VX0ghXLbE7QDnF/exec';

  try {
    const response = await axios.get(SCRIPT_URL);
    const advanceItems = response.data.advance?.items || [];

    res.status(200).json({ status: 'success', data: advanceItems });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}
