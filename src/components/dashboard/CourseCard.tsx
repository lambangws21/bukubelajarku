"use client";

import { motion } from "framer-motion";

export default function CourseCard({
  title,
  desc,
  icon: Icon,
  onClick,
}: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className="cursor-pointer rounded-xl bg-background p-4 border shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
