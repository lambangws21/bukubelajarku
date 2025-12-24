"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Brain,
} from "lucide-react";

import {
  MLTaperLearningData,
  Language,
} from "@/components/operasi/hip/data/MLTaperLearningData";

export default function MLTaperInteractiveLearning() {
  const [lang, setLang] = useState<Language>("id");
  const [index, setIndex] = useState(0);

  const section = MLTaperLearningData[index];
  const progress =
    ((index + 1) / MLTaperLearningData.length) * 100;

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* ================= HEADER ================= */}
      <div className="text-center space-y-3">
        <Badge className="mx-auto flex w-fit items-center gap-2">
          <Brain size={14} />
          Interactive Implant Learning
        </Badge>

        <h1 className="text-3xl font-bold">
          Zimmer® M/L Taper Hip System
        </h1>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {lang === "id"
            ? "Modul pembelajaran interaktif sistem stem femoral M/L Taper berbasis brosur resmi Zimmer Biomet."
            : "Interactive learning module for the M/L Taper femoral stem system based on official Zimmer Biomet documentation."}
        </p>
      </div>

      {/* ================= LANGUAGE TOGGLE ================= */}
      <div className="flex justify-center gap-2">
        <Button
          variant={lang === "id" ? "default" : "outline"}
          size="sm"
          onClick={() => setLang("id")}
        >
          🇮🇩 Indonesia
        </Button>
        <Button
          variant={lang === "en" ? "default" : "outline"}
          size="sm"
          onClick={() => setLang("en")}
        >
          🇬🇧 English
        </Button>
      </div>

      {/* ================= PROGRESS + NAV ================= */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Learning Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <Progress value={progress} />

          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </Button>

            <Button
              size="sm"
              disabled={index === MLTaperLearningData.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= CONTENT ================= */}
      <motion.div
        key={section.id + lang}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>
              {section.title[lang]}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-2">
              {section.content[lang].map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <a
              href={section.reference}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-primary underline pt-3"
            >
              Official Reference (PDF)
              <ExternalLink size={12} />
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
