"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Brain,
  ExternalLink,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { TotalHipArthroplastyData } from "@/components/operasi/hip/data/dataTHA";

export default function TotalHipArthroplastyEducation() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSection = TotalHipArthroplastyData[activeIndex];
  const progress =
    ((activeIndex + 1) / TotalHipArthroplastyData.length) * 100;

  const goPrev = () => {
    if (activeIndex > 0) setActiveIndex((i) => i - 1);
  };

  const goNext = () => {
    if (activeIndex < TotalHipArthroplastyData.length - 1)
      setActiveIndex((i) => i + 1);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      {/* ================= HEADER ================= */}
      <div className="text-center space-y-4">
        <Badge className="mx-auto flex w-fit items-center gap-2">
          <GraduationCap size={14} />
          Clinical Education Module
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight">
          Total Hip Arthroplasty (THA)
        </h1>

        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Modul edukasi berbasis literatur ilmiah untuk memahami indikasi,
          teknik, dan komplikasi Total Hip Arthroplasty.
        </p>
      </div>

      {/* ================= PROGRESS + NAV ================= */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Learning Progress
            </span>
            <span className="font-medium">
              {Math.round(progress)}%
            </span>
          </div>

          <Progress value={progress} />

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={activeIndex === 0}
              onClick={goPrev}
            >
              <ChevronLeft size={16} />
              Prev
            </Button>

            <span className="text-xs text-muted-foreground">
              {activeIndex + 1} / {TotalHipArthroplastyData.length}
            </span>

            <Button
              size="sm"
              disabled={
                activeIndex === TotalHipArthroplastyData.length - 1
              }
              onClick={goNext}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= FOCUS MODE ================= */}
      <motion.div
        key={activeSection.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={18} />
              Focus Learning
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <h3 className="font-semibold">
              {activeSection.title}
            </h3>

            {Array.isArray(activeSection.content) ? (
              <ul className="list-disc pl-5 space-y-2">
                {activeSection.content.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              <p>{activeSection.content}</p>
            )}

            {activeSection.reference && (
              <a
                href={activeSection.reference}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary underline"
              >
                Referensi NCBI
                <ExternalLink size={12} />
              </a>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ================= ALL MATERIAL ================= */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Materi Lengkap</CardTitle>
        </CardHeader>

        <CardContent>
          <Accordion
            type="single"
            collapsible
            value={activeSection.id}
            className="space-y-3"
          >
            {TotalHipArthroplastyData.map((section, index) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="rounded-xl border px-3"
              >
                <AccordionTrigger
                  onClick={() => setActiveIndex(index)}
                  className="gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 size={14} />
                    Evidence-based content
                  </div>

                  {Array.isArray(section.content) ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {section.content.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{section.content}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
