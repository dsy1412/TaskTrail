"use client";

import { Layers } from "lucide-react";

export function PriorityColumn({ index }: { index: number }) {
  return (
    <div className="flex h-10 items-center justify-center gap-2 border-b border-slate-200/70 text-xs font-semibold text-slate-500">
      <Layers className="h-3.5 w-3.5" />
      {index === 0 ? "Primary" : `Column ${index + 1}`}
    </div>
  );
}
