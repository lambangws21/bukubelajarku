"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { CircleX, Loader2 } from "lucide-react";
import { format } from 'date-fns';

// Definisi tipe data sesuai dengan respons API
type SheetDataItem = {
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

const ITEMS_PER_PAGE = 6; // Menentukan jumlah item per halaman

const DisplayData = () => {
  const [data, setData] = useState<SheetDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/getGoogleSheets');
        const result = await response.json();

        if (result.error) {
          setError(result.error);
        } else if (Array.isArray(result.data)) {
          const formattedData = result.data.map((item: SheetDataItem) => ({
            ...item,
            date: format(new Date(item.date), 'yyyy-MM-dd'),
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Hitung item untuk halaman saat ini
  const paginatedData = data.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-14 w-14 text-gray-500" />
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
      {/* Menampilkan total data dan data yang sedang ditampilkan */}
      <div className="mb-2 text-sm text-gray-600">
        Menampilkan {paginatedData.length} dari {data.length} total data.
      </div>

      {paginatedData.map((item, index) => (
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

      {/* Tampilkan Pagination jika jumlah data lebih dari 10 */}
      {data.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded-md ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayData;
