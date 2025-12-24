"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CircleDot,
} from "lucide-react";

import {
  ZCAAllPolyAcetabularLearningData,
  ZCAAllPolyLearningSection,
  Language,
} from "@/components/operasi/hip/data/zcaAllPolyAcetabularLearningData";

/* ================= ANIMATION ================= */
const slideFade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ZCAAllPolyInteractiveLearning() {
  const [lang, setLang] = useState<Language>("id");
  const [currentOrder, setCurrentOrder] = useState(1);

  /* ================= SORT DATA (NO INDEX) ================= */
  const sections = useMemo<ZCAAllPolyLearningSection[]>(
    () =>
      [...ZCAAllPolyAcetabularLearningData].sort(
        (a, b) => a.order - b.order
      ),
    []
  );

  function cleanText(text: string) {
    return text.replace(/:contentReference\[.*?\]\{.*?\}/g, "").trim();
  }
  

  const currentSection = sections.find(
    (s) => s.order === currentOrder
  );

  const totalSteps = sections.length;
  const progress = (currentOrder / totalSteps) * 100;

  if (!currentSection) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* ================= HEADER ================= */}
      <div className="text-center space-y-3">
        <Badge className="mx-auto flex w-fit items-center gap-2">
          <CircleDot size={14} />
          Cemented Acetabular Learning
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight">
          ZCA® All-Poly Acetabular Cup
        </h1>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {lang === "id"
            ? "Modul edukasi klinis sistem acetabulum cemented berbasis brosur resmi ZCA® All-Poly."
            : "Clinical education module for the cemented ZCA® All-Poly acetabular system based on official documentation."}
        </p>
      </div>

      {/* ================= LANGUAGE ================= */}
      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant={lang === "id" ? "default" : "outline"}
          onClick={() => setLang("id")}
        >
          🇮🇩 Indonesia
        </Button>
        <Button
          size="sm"
          variant={lang === "en" ? "default" : "outline"}
          onClick={() => setLang("en")}
        >
          🇬🇧 English
        </Button>
      </div>

      {/* ================= PROGRESS ================= */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Learning Progress
            </span>
            <span className="font-medium">
              Step {currentSection.order} / {totalSteps}
            </span>
          </div>

          <Progress value={progress} />

          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={currentSection.order === 1}
              onClick={() =>
                setCurrentOrder((o) => Math.max(1, o - 1))
              }
            >
              <ChevronLeft size={16} />
              Prev
            </Button>

            <Button
              size="sm"
              disabled={currentSection.order === totalSteps}
              onClick={() =>
                setCurrentOrder((o) =>
                  Math.min(totalSteps, o + 1)
                )
              }
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= CONTENT ================= */}
      <motion.div
        key={`${currentSection.slug}-${lang}`}
        variants={slideFade}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.35 }}
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {currentSection.order}
              </span>

              <CardTitle>
                {currentSection.title[lang]}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-sm leading-relaxed">
            <ul className="list-disc pl-5 space-y-2">
              {currentSection.content[lang].map((text) => (
                <li
                key={`${currentSection.slug}-${text.slice(0, 40)}`}
                >
                  { cleanText (text)}
                </li>
              ))}
            </ul>

            <a
              href={currentSection.reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary underline pt-3"
            >
              {currentSection.reference.label}
              <ExternalLink size={12} />
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
