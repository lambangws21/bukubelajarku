// components/DataList.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";
import { motion } from "framer-motion";

type SheetDataItem = {
  id: number;
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

interface DataListProps {
  data: SheetDataItem[] | null;
  onEdit: (item: SheetDataItem) => void;
  onDelete: (id: number) => void;
}

const DataList: React.FC<DataListProps> = ({ data, onEdit, onDelete }) => {
  // Pastikan data adalah array yang valid
  if (!data || !Array.isArray(data)) {
    return <div className="text-red-500">Data tidak valid. Silakan coba lagi.</div>;
  }

  // Jika array data kosong
  if (data.length === 0) {
    return <div className="text-gray-500">Tidak ada data untuk ditampilkan.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
      {data.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="mb-6"
        >
          <Card className="shadow-lg border border-gray-200 rounded-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-zinc-500 text-white rounded-t-lg p-4 flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Badge className="mr-2 bg-white text-black">{index + 1}</Badge>
                Tanggal: {item.date}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button onClick={() => onEdit(item)} variant="outline" className="text-white hover:bg-gray-700 hover:text-white transition-colors">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button onClick={() => onDelete(item.id)} variant="outline" className="text-red-500 hover:bg-red-100 transition-colors">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
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
    </div>
  );
};

export default DataList;
