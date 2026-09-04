"use client";

import { useMode } from "@/features/mode/ModeProvider";
import { LegacyLocalHome } from "@/features/home/LegacyLocalHome";
import { ProHome } from "@/features/home/ProHome";

export default function JobNestHomePage() {
  const { mode } = useMode();

  if (mode === "PRO") {
    return <ProHome />;
  }

  // Default to Local Mode (legacy experience)
  return <LegacyLocalHome />;
}
