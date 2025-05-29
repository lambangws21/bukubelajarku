"use client";

import { motion } from "framer-motion";

export default function JadwalTable({ data, onEdit, onDelete }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <table className="w-full border mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">No</th>
            <th>RS</th><th>Alamat</th><th>Dokter</th>
            <th>Mulai</th><th>Selesai</th><th>Status</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={row.id} className="border-t text-sm text-center">
              <td className="p-2">{i + 1}</td>
              <td>{row.rumahSakit}</td>
              <td>{row.alamat}</td>
              <td>{row.dokter}</td>
              <td>{row.waktuMulai}</td>
              <td>{row.waktuSelesai}</td>
              <td>{row.status}</td>
              <td>
                <button onClick={() => onEdit(row)} className="text-blue-600 px-2">Edit</button>
                <button onClick={() => onDelete(row.id)} className="text-red-600 px-2">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
