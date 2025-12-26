"use client";

import { createContext, useContext } from "react";
import { ActiveCourse } from "@/types/activeCourse";

type Ctx = {
  active: ActiveCourse;
  setActive: (v: ActiveCourse) => void;
};

export const ActiveCourseContext = createContext<Ctx | null>(null);

export function useActiveCourse() {
  const ctx = useContext(ActiveCourseContext);
  if (!ctx) {
    throw new Error("useActiveCourse must be used inside ActiveCourseContext");
  }
  return ctx;
}
