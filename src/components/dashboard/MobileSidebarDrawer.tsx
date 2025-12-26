
"use client";

import { motion, AnimatePresence } from "framer-motion";
import SidebarNavigation from "./Sidebar";

export default function MobileSidebarDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* DRAWER */}
          <motion.div
            className="fixed top-0 left-0 h-screen w-[280px] bg-background z-50"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ ease: "easeOut", duration: 0.25 }}
          >
            <SidebarNavigation onSelect={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
