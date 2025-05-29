// file: components/operasi/hip/planing.tsx

"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ThrPlanningData } from "@/components/operasi/hip/data/ThrPlanningData";

export const PlaningCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold">
          Planning Pre dan Post Operasi THR
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ThrPlanningData.map((step, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
          >
            <Image
              src={step.image}
              alt={step.title}
              width={460}
              height={280}
              className="rounded-md shadow-md object-contain"
            />
            <h3 className="mt-4 font-semibold text-lg text-primary">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 px-4">
              {step.description}
            </p>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
