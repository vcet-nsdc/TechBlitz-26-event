"use client";

import { Slider } from "@/components/ui/slider";

export function CriteriaSlider({
  label,
  value,
  max,
  onChange
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-200">{label}</span>
        <span className="text-xs text-zinc-400">
          {value} / {max}
        </span>
      </div>
      <Slider value={[value]} max={max} min={0} step={1} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
