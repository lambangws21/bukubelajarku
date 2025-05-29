// file: components/operasi/hip/ThrTechniqueCard.tsx

"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { ThrTechniqueData } from "@/components/operasi/hip/data/surgical-teqhniuqe-thr";

export const ThrTechniqueCard = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="md:w-1/4 sticky top-4 h-fit bg-muted p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Navigasi Langkah</h2>
        <ul className="space-y-2 text-sm">
          {ThrTechniqueData.map((step) => (
            <li key={step.id}>
              <a
                href={`#${step.id}`}
                className="hover:underline text-primary"
              >
                {step.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <Card className="w-full md:w-3/4">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            Teknik Bedah Total Hip Replacement (THR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {ThrTechniqueData.map((step) => (
              <AccordionItem key={step.id} value={step.id}>
                <div id={step.id} className="scroll-mt-24">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <AccordionTrigger>{step.title}</AccordionTrigger>
                      </motion.div>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-w-xs">
                      {step.hoverNote}
                    </HoverCardContent>
                  </HoverCard>
                  <AccordionContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {step.image && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Image
                          src={`/${step.image}`}
                          alt={step.title}
                          width={468}
                          height={320}
                          className="rounded-md w-auto h-auto mx-auto"
                        />
                      </motion.div>
                    )}
                  </AccordionContent>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};
