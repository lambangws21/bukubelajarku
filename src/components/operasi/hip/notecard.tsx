// file: components/operasi/hip/NoteCard.tsx

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { motion } from "framer-motion";

const acetabulumNotes = [
  {
    component: "Inklinasi Acetabulum",
    degree: "40-45°",
    description: "Kemiringan cup acetabulum terhadap bidang frontal untuk stabilitas optimal dan mengurangi risiko impingement dan dislokasi."
  },
  {
    component: "Versi Acetabulum",
    degree: "10-20°",
    description: "Rotasi anterior acetabulum untuk menyesuaikan orientasi anatomical pelvis."
  },
  {
    component: "Anteversi Femoral",
    degree: "10-15°",
    description: "Menyesuaikan arah leher femur agar linier terhadap orientasi acetabulum."
  },
  {
    component: "Abduksi Kaki",
    degree: "10-20°",
    description: "Digunakan untuk mengekspos sendi secara optimal dan mempertahankan offset."
  },
  {
    component: "Rotasi Eksternal Kaki",
    degree: "5-10°",
    description: "Posisi rotasi ringan untuk membantu orientasi stem femoral."
  },
  {
    component: "Fleksi Pinggul dan Lutut",
    degree: "10-15°",
    description: "Mengurangi ketegangan jaringan lunak dan membantu akses ke sendi pinggul."
  }
];

const NoteCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="my-6 w-full overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Posisi & Sudut Ideal Acetabulum dan Femur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Table className="w-full">
              <thead>
                <tr className="m-0 border-t p-0 even:bg-muted">
                  <th className="border px-4 py-2 text-left font-bold">Komponen</th>
                  <th className="border px-4 py-2 text-left font-bold">Derajat Ideal</th>
                  <th className="border px-4 py-2 text-left font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {acetabulumNotes.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border-t even:bg-muted"
                  >
                    <td className="border px-4 py-2">{row.component}</td>
                    <td className="border px-4 py-2">
                      <Badge variant="secondary">{row.degree}</Badge>
                    </td>
                    <td className="border px-4 py-2 text-sm text-muted-foreground">
                      {row.description}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NoteCard;
