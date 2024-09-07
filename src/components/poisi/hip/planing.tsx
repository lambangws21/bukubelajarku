'use client';

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import PreOperasi from "@/app/procedure/posisihip/img/preop.jpg";
import PostOperasi from "@/app/procedure/posisihip/img/postOp.jpg";
import Gambar1 from "@/app/procedure/posisihip/img/62_Pr010_i010.png";
import Gambar2 from "@/app/procedure/posisihip/img/62_Pr010_i020.png";

export const PlaningCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning Pre Operasi</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="flex items-center justify-center mb-3 flex-col"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mb-3"
          >
            <Image
              src={PreOperasi}
              alt="Penjelasan Gambar Pertama"
              width={268}
              height={126}
              className="rounded-md w-auto h-auto"
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mb-3"
          >
            <Image
              src={PostOperasi}
              alt="Penjelasan Gambar Pertama"
              width={268}
              height={126}
              className="rounded-md w-auto h-auto"
            />
          </motion.div>
        </motion.div>
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mb-3"
          >
            <Image
              src={Gambar1}
              alt="Penjelasan Gambar Pertama"
              width={468}
              height={826}
              className="rounded-md w-auto h-auto"
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mb-3"
          >
            <Image
              src={Gambar2}
              alt="Penjelasan Gambar Pertama"
              width={468}
              height={826}
              className="rounded-md w-auto h-auto"
            />
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};
