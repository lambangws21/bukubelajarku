"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-16 h-8 flex items-center bg-muted rounded-full cursor-pointer px-1 relative"
    >
      <motion.div
        layout
        className="absolute top-0 bottom-0 left-0 w-1/2 h-full bg-primary rounded-full"
        animate={{ x: isDark ? "100%" : "0%" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <div className="flex justify-between w-full z-10 text-xs text-muted-foreground px-1">
        <Sun className="h-4 w-4" />
        <Moon className="h-4 w-4" />
      </div>
    </div>
  );
}
