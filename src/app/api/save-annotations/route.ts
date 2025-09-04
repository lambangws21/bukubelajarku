// import { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === "POST") {
//     const { annotations, imageName } = req.body;

//     console.log("Anotasi disimpan:", { imageName, annotations });

//     // Simpan ke database / file / Google Sheet sesuai kebutuhan
//     return res.status(200).json({ message: "Berhasil disimpan" });
//   }

//   res.status(405).json({ message: "Method not allowed" });
// }
