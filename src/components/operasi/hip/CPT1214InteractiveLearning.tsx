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
  GraduationCap,
} from "lucide-react";

import {
  CPT1214LearningContent,
  Language,
  LearningSection,
} from "@/components/operasi/hip/data/cpt12_14InteractiveLearningData";

export default function CPT1214LearningModule() {
  const [lang, setLang] = useState<Language>("id");
  const [step, setStep] = useState(0);

  const section: LearningSection = CPT1214LearningContent[step];
  const total = CPT1214LearningContent.length;

  const progress = ((step + 1) / total) * 100;

  return (
    <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* ================= HEADER ================= */}
      <div className="text-center space-y-3">
        <Badge className="mx-auto flex w-fit items-center gap-2">
          <GraduationCap size={14} />
          Clinical Learning Module
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight">
          CPT® 12/14 Hip System
        </h1>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {lang === "id"
            ? "Modul edukasi interaktif berbasis brosur resmi Zimmer Biomet untuk pemahaman sistem stem CPT® 12/14."
            : "Interactive educational module based on official Zimmer Biomet documentation for the CPT® 12/14 femoral stem system."}
        </p>
      </div>

      {/* ================= LANGUAGE TOGGLE ================= */}
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
              {step + 1} / {total}
            </span>
          </div>

          <Progress value={progress} />

          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ChevronLeft size={16} />
              Prev
            </Button>

            <Button
              size="sm"
              disabled={step === total - 1}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= FOCUS CONTENT ================= */}
      <motion.div
        key={section.slug + lang}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>
              {section.title[lang]}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm leading-relaxed">
            <ul className="list-disc pl-5 space-y-2">
              {section.content[lang].map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>

            <a
              href={section.reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary underline pt-3"
            >
              {section.reference.label}
              <ExternalLink size={12} />
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
