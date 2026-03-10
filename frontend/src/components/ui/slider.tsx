"use client";

import { cn } from "@/lib/utils";

export function Slider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 1
}: {
  className?: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0] ?? min}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={cn("h-2 w-full accent-indigo-500", className)}
    />
  );
}
