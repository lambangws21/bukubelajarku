// File: components/stock/activityLog.tsx

import React from "react";

export interface LogEntry {
  Timestamp: string;
  Aksi: string;
  Sheet: string;
  Lot: string;
  Ref: string;
  Nama: string;
  Jumlah: string;
}

interface ActivityLogProps {
  // Ubah menjadi "logs" agar konsisten
  logs: LogEntry[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        📜 Riwayat Aktivitas
      </h2>
      <div className="max-h-80 overflow-y-auto border rounded-md w-full mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2">Waktu</th>
                <th className="p-2">Aksi</th>
                <th className="p-2">Sheet</th>
                <th className="p-2">Lot</th>
                <th className="p-2">Ref</th>
                <th className="p-2">Nama</th>
                <th className="p-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 whitespace-nowrap">{log.Timestamp}</td>
                    <td className="p-2 text-blue-600 font-medium">
                      {log.Aksi}
                    </td>
                    <td className="p-2">{log.Sheet}</td>
                    <td className="p-2">{log.Lot}</td>
                    <td className="p-2">{log.Ref}</td>
                    <td className="p-2">{log.Nama}</td>
                    <td className="p-2">{log.Jumlah}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-4 text-gray-500"
                  >
                    Tidak ada data log.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
