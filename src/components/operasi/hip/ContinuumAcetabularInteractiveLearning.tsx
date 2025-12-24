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
  Layers,
  ExternalLink,
} from "lucide-react";

import {
  ContinuumAcetabularLearningData,
  LearningSection,
  Language,
} from "@/components/operasi/hip/data/continuumAcetabularLearningData";

/* ================= ANIMATION ================= */
const fadeSlide = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function sanitize(text: string) {
  return text
    .replace(/:contentReference\[.*?\]\{.*?\}/g, "")
    .trim();
}

export default function ContinuumAcetabularInteractiveLearning() {
  const [lang, setLang] = useState<Language>("id");
  const [order, setOrder] = useState(1);

  /* ================= SORT DATA (NO INDEX) ================= */
  const sections = useMemo<LearningSection[]>(
    () =>
      [...ContinuumAcetabularLearningData].sort(
        (a, b) => a.order - b.order
      ),
    []
  );

  const active = sections.find((s) => s.order === order);
  const total = sections.length;
  const progress = (order / total) * 100;

  if (!active) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 py-14 space-y-10">
      {/* ================= HEADER ================= */}
      <div className="text-center space-y-3">
        <Badge className="mx-auto flex w-fit items-center gap-2">
          <Layers size={14} />
          Cementless Acetabular Learning
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight">
          Continuum® Acetabular System
        </h1>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {lang === "id"
            ? "Modul edukasi teknik pemasangan acetabulum cementless berbasis panduan resmi Zimmer Biomet."
            : "Educational module for cementless acetabular implantation based on official Zimmer Biomet surgical techniques."}
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
              Step {active.order} / {total}
            </span>
          </div>

          <Progress value={progress} />

          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={order === 1}
              onClick={() => setOrder((o) => Math.max(1, o - 1))}
            >
              <ChevronLeft size={16} />
              Prev
            </Button>

            <Button
              size="sm"
              disabled={order === total}
              onClick={() =>
                setOrder((o) => Math.min(total, o + 1))
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
        key={`${active.slug}-${lang}`}
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.35 }}
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {active.order}
              </span>
              <CardTitle>{active.title[lang]}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-sm leading-relaxed">
            <ul className="list-disc pl-5 space-y-2">
              {active.content[lang].map((text) => (
                <li
                  key={`${active.slug}-${text.slice(0, 40)}`}
                >
                  {sanitize(text)}
                </li>
              ))}
            </ul>

            <a
              href={active.reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary underline pt-3"
            >
              {active.reference.label}
              <ExternalLink size={12} />
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
