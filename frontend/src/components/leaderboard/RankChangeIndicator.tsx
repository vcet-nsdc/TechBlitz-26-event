import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export function RankChangeIndicator({ previousRank, currentRank }: { previousRank?: number; currentRank: number }) {
  if (!previousRank || previousRank === currentRank) {
    return (
      <div className="flex items-center gap-1 text-zinc-500">
        <Minus className="h-3 w-3" />
        0
      </div>
    );
  }

  const diff = previousRank - currentRank;
  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-emerald-400">
        <ArrowUp className="h-3 w-3" />+{diff}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-red-400">
      <ArrowDown className="h-3 w-3" />
      {Math.abs(diff)}
    </div>
  );
}
