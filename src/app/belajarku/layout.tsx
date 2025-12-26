"use client";

import { useState } from "react";
import Providers from "@/components/dashboard/Providers";
import SidebarNavigation from "@/components/dashboard/Sidebar";
import RightPanel from "@/components/dashboard/RightPanel";
import MobileHeader from "@/components/dashboard/MobileHeader";
import MobileSidebarDrawer from "@/components/dashboard/MobileSidebarDrawer";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Providers>
      <div className="min-h-screen bg-muted/30">

        {/* MOBILE HEADER */}
        <MobileHeader onOpen={() => setMobileOpen(true)} />

        {/* MOBILE DRAWER */}
        <MobileSidebarDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* DESKTOP GRID */}
        <div className="hidden md:grid grid-cols-[280px_1fr_320px]">

          {/* SIDEBAR */}
          <div className="h-screen sticky top-0">
            <SidebarNavigation />
          </div>

          {/* MAIN */}
          <main className="px-6 py-6 overflow-y-auto">
            {children}
          </main>

          {/* RIGHT PANEL */}
          <div className="h-screen sticky top-0">
            <RightPanel />
          </div>
        </div>

        {/* MOBILE MAIN */}
        <main className="md:hidden px-4 py-4">
          {children}
        </main>

      </div>
    </Providers>
  );
}
