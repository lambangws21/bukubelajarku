'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { motion } from "framer-motion";

const NoteCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="my-6 w-full overflow-y-auto">
        <CardHeader>
          <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Hip Positioning in Hemiarthroplasty-Lateral Position
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
                  <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                    Component
                  </th>
                  <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                    Recommended Degree
                  </th>
                  <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    component: "Inklinasi Acetabulum",
                    degree: "40-45°",
                    description:
                      "Sudut kemiringan acetabulum untuk stabilitas implan dan mengurangi risiko dislokasi.",
                  },
                  {
                    component: "Medialisasi",
                    degree: "90°",
                    description:
                      "Untuk Menentukan kedalaman saat rhimer dan implant Liner dan head.",
                  },
                  {
                    component: "Versi Acetabulum",
                    degree: "10-20°",
                    description:
                      "Rotasi acetabulum ke depan atau ke belakang untuk orientasi yang tepat.",
                  },
                  {
                    component: "Anteversi Femoral",
                    degree: "10-15°",
                    description:
                      "Rotasi leher femur ke depan agar implan femoral berfungsi optimal.",
                  },
                  {
                    component: "Abduksi Kaki",
                    degree: "10-20°",
                    description:
                      "Gerakan kaki ke arah luar untuk akses yang lebih baik ke sendi pinggul.",
                  },
                  {
                    component: "Rotasi Eksternal Kaki",
                    degree: "Minimal (5-10°)",
                    description:
                      "Rotasi kaki sedikit ke luar untuk orientasi implan yang tepat.",
                  },
                  {
                    component: "Fleksi Pinggul dan Lutut",
                    degree: "10-15°",
                    description:
                      "Fleksi ringan untuk mengurangi ketegangan jaringan lunak dan memudahkan akses.",
                  },
                ].map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="m-0 border-t p-0 even:bg-muted"
                  >
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      {row.component}
                    </td>
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      <Badge variant="secondary">{row.degree}</Badge>
                    </td>
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
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
