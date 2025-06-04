// File: components/ActivityLog.tsx
"use client";
import React from "react";
import { Clock } from "lucide-react";

interface LogEntry {
  Timestamp: string;
  Aksi: string;
  Sheet: string;
  Lot: string;
  Ref: string;
  Nama: string;
  Jumlah: string;
}
interface ActivityLogProps {
  recentLogs: LogEntry[];
}
export default function ActivityLog({ recentLogs }: ActivityLogProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        📜 Riwayat Aktivitas <Clock size={18} />
      </h2>
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full min-w-[600px] text-sm">
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
            {recentLogs.length > 0 ? (
              recentLogs.map((log, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 whitespace-nowrap">{log.Timestamp}</td>
                  <td className="p-2 text-blue-600 font-medium">{log.Aksi}</td>
                  <td className="p-2">{log.Sheet}</td>
                  <td className="p-2">{log.Lot}</td>
                  <td className="p-2">{log.Ref}</td>
                  <td className="p-2">{log.Nama}</td>
                  <td className="p-2">{log.Jumlah}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  Tidak ada data log yang tersedia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}