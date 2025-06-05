// File: components/stock/activityLog.tsx
"use client";

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
  logs: LogEntry[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-2">Riwayat Aktivitas</h2>
      <div className="max-h-60 overflow-y-auto border rounded w-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-1">Waktu</th>
              <th className="p-1">Aksi</th>
              <th className="p-1">Sheet</th>
              <th className="p-1">Lot</th>
              <th className="p-1">Ref</th>
              <th className="p-1">Nama</th>
              <th className="p-1">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-1">{log.Timestamp}</td>
                  <td className="p-1 text-blue-600">{log.Aksi}</td>
                  <td className="p-1">{log.Sheet}</td>
                  <td className="p-1">{log.Lot}</td>
                  <td className="p-1">{log.Ref}</td>
                  <td className="p-1">{log.Nama}</td>
                  <td className="p-1">{log.Jumlah}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  Tidak ada data log.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
