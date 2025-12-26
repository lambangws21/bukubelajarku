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
import { Camera, Target, AlertTriangle } from "lucide-react";

import { ThrTechniqueData } from "@/components/operasi/hip/data/surgical-teqhniuqe-thr";

export const ThrTechniqueCard = () => {
  return (
    <Card className="w-full shadow-md">
      {/* ================= HEADER ================= */}
      <CardHeader className="space-y-2">
        <CardTitle className="text-center text-xl md:text-2xl font-bold tracking-tight">
          Surgical Technique Overview – Total Hip Replacement
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          Alur intra-operatif ringkas sebagai panduan sebelum masuk ke teknik
          komponen implan yang lebih spesifik.
        </p>
      </CardHeader>

      {/* ================= CONTENT ================= */}
      <CardContent>
        <Accordion type="single" collapsible className="space-y-4">
          {ThrTechniqueData.map((step, idx) => (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="rounded-xl border"
            >
              {/* ================= HEADER ================= */}
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 260 }}
                  >
                    <AccordionTrigger className="px-4 py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left">
                        <Badge variant="secondary">
                          Step {idx + 1}
                        </Badge>
                        <span className="font-medium">
                          {step.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                  </motion.div>
                </HoverCardTrigger>

                {/* Hover hanya meaningful di desktop */}
                <HoverCardContent className="hidden md:block max-w-xs text-sm leading-relaxed">
                  {step.hoverNote}
                </HoverCardContent>
              </HoverCard>

              {/* ================= BODY ================= */}
              <AccordionContent className="px-4 pb-5 space-y-5">
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
                  <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
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
                    className="space-y-3"
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
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
