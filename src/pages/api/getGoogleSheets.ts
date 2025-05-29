import type { NextApiRequest, NextApiResponse } from 'next';

// URL dari endpoint Google Apps Script
const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx29DQRI1xW2qFmZxvOmME51a-MM8ZELCNzAQdvZOoEqrNhgpB5evsT_76oXD50VhKwug/exec';

// Definisi tipe data respons untuk setiap item
interface SheetDataItem {
  date: string;
  rumahSakit?: string; // Opsional karena field ini mungkin berbeda antar sheet
  operasi?: string;
  operator?: string;
  jumlah: number;
  jenisBiaya?: string; // Opsional
  klaim?: string;
}

// Definisi tipe data respons API
type ResponseData = {
  data?: SheetDataItem;
  error?: string;
  status?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
): Promise<void> {
  try {
    const { sheet } = req.query; // Ambil parameter sheet dari query string
    const urlWithSheet = `${GOOGLE_SCRIPT_URL}?sheet=${sheet || 'Sheet1'}`; // Tambahkan parameter sheet ke URL

    if (req.method === 'GET') {
      const response = await fetch(urlWithSheet); // Gunakan URL yang sudah dimodifikasi

      if (!response.ok) {
        throw new Error('Gagal mengambil data dari Google Apps Script');
      }

      const result = await response.json();

       if (result && result.data && Array.isArray(result.data)) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ data: result.data });
      } else if (result && result.error) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ error: result.error });
      } else {
        res.setHeader('Cache-Control', 'no-store');
        res.status(500).json({ error: 'Format data tidak terduga dari Google Apps Script.' });
      }


    } else if (req.method === 'POST') {
      const response = await fetch(urlWithSheet, { // Gunakan URL yang sudah dimodifikasi
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim data ke Google Apps Script');
      }

      const data: { status: string; error?: string } = await response.json();

      if (data.status) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ status: data.status });
      } else if (data.error) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(500).json({ error: data.error });
      } else {
        res.setHeader('Cache-Control', 'no-store');
        res.status(500).json({ error: 'Unexpected response from Google Apps Script' });
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Tidak Diizinkan`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}



// import type { NextApiRequest, NextApiResponse } from 'next';

// // URL dari endpoint Google Apps Script
// const GOOGLE_SCRIPT_URL =
//   'https://script.google.com/macros/s/AKfycbxbRc0lxJKMIkduQKDtb-f-oeUJF8h5QaeHKk68tVFViSQIvUDn1rAmkDYXIsacnBv5Eg/exec';

// // Definisi tipe data respons untuk setiap item
// type SheetDataItem = {
//   date: string;
//   rumahSakit: string;
//   operasi: string;
//   operator: string;
//   jumlah: number;
// };

// // Definisi tipe data respons API
// type ResponseData = {
//   data?: SheetDataItem[];
//   error?: string;
//   status?: string;
// };

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ResponseData>
// ): Promise<void> {
//   try {
//     if (req.method === 'GET') {
//       const response = await fetch(GOOGLE_SCRIPT_URL);

//       if (!response.ok) {
//         throw new Error('Failed to fetch data from Google Apps Script');
//       }

//       const result = await response.json();

//       // Pastikan data yang diterima dari Google Apps Script adalah array
//       if (result && Array.isArray(result.data)) {
//         res.setHeader('Cache-Control', 'no-store');
//         res.status(200).json({ data: result.data }); // Pastikan kita mengembalikan data dalam format yang diharapkan
//       } else {
//         res.setHeader('Cache-Control', 'no-store');
//         res.status(200).json({ error: 'Unexpected data format received from Google Apps Script.' });
//       }
//     } else if (req.method === 'POST') {
//       const response = await fetch(GOOGLE_SCRIPT_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(req.body), // Mengirimkan data yang diterima dari form
//       });

//       if (!response.ok) {
//         throw new Error('Failed to post data to Google Apps Script');
//       }

//       const data: { status: string } = await response.json();
//       res.setHeader('Cache-Control', 'no-store');
//       res.status(200).json({ status: data.status });
//     } else {
//       res.setHeader('Allow', ['GET', 'POST']);
//       res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// }
