"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { CircleX, Loader2 } from "lucide-react";
import { format } from 'date-fns'; // Import date-fns untuk memformat tanggal

// Definisi tipe data sesuai dengan respons API
type SheetDataItem = {
  date: string; // Tanggal diharapkan dalam format string
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

const DisplayData = () => {
  const [data, setData] = useState<SheetDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/getGoogleSheets');
        const result = await response.json();

        // Pastikan respons API mengandung data dalam format array
        if (result.error) {
          setError(result.error);
        } else if (Array.isArray(result.data)) {
          // Format tanggal setiap item jika perlu
          const formattedData = result.data.map((item: SheetDataItem) => ({
            ...item,
            date: format(new Date(item.date), 'yyyy-MM-dd'), // Memformat tanggal ke format yang diinginkan
          }));
          setData(formattedData);
        } else {
          setError('Unexpected data format received from the API.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-14 w-14 text-gray-500" /> {/* Loader Animasi */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        <CircleX className="h-6 w-6 inline-block mr-2" />
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Data Operasi</h2>
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="mb-4"
        >
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Tanggal: {item.date}</CardTitle>
              <CardDescription>Rumah Sakit: {item.rumahSakit}</CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Operasi:</strong> {item.operasi}</p>
              <p><strong>Operator:</strong> {item.operator}</p>
              <p><strong>Jumlah:</strong> {item.jumlah}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DisplayData;
