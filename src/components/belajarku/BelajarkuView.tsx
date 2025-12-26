"use client";

import { useActiveCourse } from "@/components/dashboard/useActiveCourse";
import CourseRenderer from "@/components/dashboard/CourseRenderer";

export default function BelajarkuView() {
  const { active } = useActiveCourse();
  return <CourseRenderer active={active} />;
}
