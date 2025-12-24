"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Target,
  AlertTriangle,
} from "lucide-react";

import { ThrTechniqueData } from "@/components/operasi/hip/data/surgical-teqhniuqe-thr";

export const ThrTechniqueCard = () => {
  return (
    <div className="relative flex flex-col lg:flex-row gap-6">
      {/* ================= SIDEBAR ================= */}
      <aside className="lg:w-1/4 lg:sticky lg:top-6 h-fit rounded-xl border bg-background/80 backdrop-blur p-4 shadow-sm">
        <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase">
          Surgical Flow
        </h2>

        <ul className="space-y-2">
          {ThrTechniqueData.map((step, idx) => (
            <li key={step.id}>
              <a
                href={`#${step.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="truncate">
                  {step.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <Card className="w-full lg:w-3/4 shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            Surgical Technique Overview – Total Hip Replacement
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Alur intra-operatif ringkas sebagai panduan sebelum
            masuk ke teknik komponen spesifik
          </p>
        </CardHeader>

        <CardContent>
          <Accordion type="single" collapsible className="space-y-3">
            {ThrTechniqueData.map((step, idx) => (
              <AccordionItem
                key={step.id}
                value={step.id}
                className="rounded-xl border"
              >
                <div id={step.id} className="scroll-mt-28">
                  {/* ================= HEADER ================= */}
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 260 }}
                      >
                        <AccordionTrigger className="gap-3 px-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">
                              Step {idx + 1}
                            </Badge>
                            <span className="text-left font-medium">
                              {step.title}
                            </span>
                          </div>
                        </AccordionTrigger>
                      </motion.div>
                    </HoverCardTrigger>

                    <HoverCardContent className="max-w-xs text-sm leading-relaxed">
                      {step.hoverNote}
                    </HoverCardContent>
                  </HoverCard>

                  {/* ================= CONTENT ================= */}
                  <AccordionContent className="px-4 pb-4 space-y-5">
                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-muted-foreground"
                    >
                      {step.description}
                    </motion.p>

                    {/* Surgical Focus */}
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Target size={14} />
                        Fokus Teknik Bedah
                      </div>
                      <p className="text-muted-foreground">
                        {step.focus}
                      </p>
                    </div>

                    {/* Clinical Reminder */}
                    {step.reminder && (
                      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-sm">
                        <div className="flex items-center gap-2 font-medium text-amber-700">
                          <AlertTriangle size={14} />
                          Clinical Reminder
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {step.reminder}
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    {step.images && step.images.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Camera size={14} />
                          Dokumentasi Visual
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {step.images.map((img) => (
                            <div
                              key={`${step.id}-${img}`}
                              className="relative overflow-hidden rounded-xl border bg-muted"
                            >
                              <Image
                                src={`/${img}`}
                                alt={step.title}
                                width={520}
                                height={360}
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
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
