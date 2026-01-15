

export type CalcResult = {
  aHKAA: number;
  withinRange: boolean;
  classification: "OK" | "OUT_OF_RANGE";
  message: string;
};

export type HkaResult = {
  side: Side | "neutral";
  absAngle: number;
  message: string;
};



  
export type Point = { x: number; y: number }; // 0..1 normalized


/** ✅ Q&A TYPES */

export type Side = "varus" | "valgus";

export type Range = { min: number; max: number };

export type Step = {
  id: string;
  title: string;
  detail: string;
};

export type FormulaDefinition = {
  name: "aHKAA";
  formulaText: "aHKAA = MPTA - LDFA";
  targetDeg: number;
  acceptableDeviation: Range;
  meaning: { MPTA: string; LDFA: string };
};

export type WorkedExample = {
  MPTA: number;
  LDFA: number;
  aHKAA: number;
  interpretation: string;
  riskNote: string;
};

export type PatientExample = {
  id: string;
  label: string;
  hkaAngleDeg: number;
  interpretation: Side;
  notes: string;
};

export type ImageItem = {
  id: "img-1" | "img-2" | "img-3";
  label: string;
  src: string; // path di /public
};

/* ================= Q&A TYPES ================= */

export type ChatRole = "bot" | "user";

export type ChatBubble = {
  id: string;
  role: ChatRole;
  text: string;
};

export type QAChoice = {
  id: string;
  label: string;
  value: Side;
  helper?: string;
};

export type QAAnswerValue = string | number | boolean;

export type QAStep =
  | {
      id: "side";
      kind: "choice";
      question: string;
      choices: QAChoice[];
      script?: ChatBubble[];
    }
  | {
      id: "measure_hka";
      kind: "number";
      question: string;
      unit?: string;
      min: number;
      max: number;
      placeholder?: string;
      hint?: string;
      script?: ChatBubble[];
    }
  | {
      id: "mpta";
      kind: "number";
      question: string;
      unit?: string;
      min: number;
      max: number;
      placeholder?: string;
      hint?: string;
      script?: ChatBubble[];
    }
  | {
      id: "ldfa";
      kind: "number";
      question: string;
      unit?: string;
      min: number;
      max: number;
      placeholder?: string;
      hint?: string;
      script?: ChatBubble[];
    }
  | {
      id: "confirm";
      kind: "confirm";
      question: string;
      hint?: string;
      script?: ChatBubble[];
    };

export type QAState = {
  currentIndex: number;
  answers: Partial<Record<QAStep["id"], QAAnswerValue>>;
};

export type QAResult = {
  side: Side;
  hkaDeg: number;
  aHKAA: number;
  status: "OK" | "OUT";
  notes: string[];
};

export type AlignmentContent = {
  topic: string;
  steps: Step[];
  formula: FormulaDefinition;
  workedExample: WorkedExample;
  patientExamples: PatientExample[];
  images: ImageItem[];
  qaSteps: QAStep[];
};

