"use client";

import dynamic from "next/dynamic";

const ImplantTemplatingCanvas = dynamic(
  () => import("@/components/digitalTemplating/digitalTemplatingViewer"),
  { ssr: false }
);

export default function TemplatingClient() {
  return <ImplantTemplatingCanvas />;
}

