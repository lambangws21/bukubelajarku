// File: /pages/api/getDoctorImages.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// URL Web App Google Apps Script untuk getDoctorImages()
const APPSCRIPT_URL = process.env.NEXT_PUBLIC_APPSCRIPT_URL! + '?action=getDoctorImages';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Hanya mengizinkan method GET
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Panggil Apps Script getDoctorImages()
    const response = await fetch(APPSCRIPT_URL, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Apps Script returned status ${response.status}`);
    }

    const json = await response.json();
    return res.status(200).json(json);
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
