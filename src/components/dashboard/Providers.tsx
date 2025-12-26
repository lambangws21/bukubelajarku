"use client";

import { useState, useEffect } from "react";
import { ActiveCourseContext } from "@/components/dashboard/useActiveCourse";
import { ActiveCourse } from "@/types/activeCourse";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<ActiveCourse>("hip-posisi");

  // optional: persist
  useEffect(() => {
    const saved = localStorage.getItem("activeCourse");
    if (saved) setActive(saved as ActiveCourse);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeCourse", active);
  }, [active]);

  return (
    <ActiveCourseContext.Provider value={{ active, setActive }}>
      {children}
    </ActiveCourseContext.Provider>
  );
}
