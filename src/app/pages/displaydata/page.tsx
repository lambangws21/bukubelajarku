"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { CircleX, Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [filteredData, setFilteredData] = useState<SheetDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false); // State untuk menampilkan atau menyembunyikan input pencarian

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getGoogleSheets");
        const result = await response.json();

        if (result.error) {
          setError(result.error);
        } else if (Array.isArray(result.data)) {
          const formattedData = result.data.map((item: SheetDataItem) => ({
            ...item,
            date: format(new Date(item.date), "yyyy-MM-dd"),
          }));
          setData(formattedData);
          setFilteredData(formattedData);
        } else {
          setError("Unexpected data format received from the API.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = data.filter(
      (item) =>
        item.date.includes(query) ||
        item.operator.toLowerCase().includes(query) ||
        item.operasi.toLowerCase().includes(query)
    );

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleSearch = () => {
    setShowSearch((prev) => !prev); // Toggle input pencarian
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

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
    <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
      {/* Tombol ikon pencarian dan input pencarian */}
      <div className="flex justify-between items-center mb-4 bg-slate-200 p-2 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold">Data Operasi</h2>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={toggleSearch}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-600 hover:text-blue-500 focus:outline-none"
          >
            <Search className="h-6 w-6" />
          </motion.button>

          {/* Animasi untuk menampilkan atau menyembunyikan input pencarian */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "200px" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="flex"
              >
                <Input
                  type="text"
                  placeholder="Cari berdasarkan tanggal, nama dokter, atau tindakan operasi..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Menampilkan total data dan data yang sedang ditampilkan */}
      <div className="mb-4 text-sm text-gray-600 text-left">
        Menampilkan {paginatedData.length} dari {filteredData.length} total data.
      </div>

      {paginatedData.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="mb-6"
        >
          <Card className="shadow-lg border border-gray-200 rounded-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-zinc-500 text-white rounded-t-lg p-4">
              <CardTitle className="flex items-center">
                <Badge className="mr-2 bg-white text-black">{index + 1}</Badge>
                Tanggal: {item.date}
              </CardTitle>
              <CardDescription className="mt-1 text-slate-50">Rumah Sakit: {item.rumahSakit}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div>
                <span className="font-semibold">Operasi:</span> <Badge variant="outline">{item.operasi}</Badge>
              </div>
              <div>
                <span className="font-semibold">Operator:</span> <Badge variant="outline">{item.operator}</Badge>
              </div>
              <div>
                <span className="font-semibold">Jumlah:</span> <Badge variant="outline">{item.jumlah}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Tampilkan Pagination jika jumlah data lebih dari ITEMS_PER_PAGE */}
      {filteredData.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <Button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              variant={currentPage === index + 1 ? "default" : "secondary"}
              className={`px-4 py-2`}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayData;
