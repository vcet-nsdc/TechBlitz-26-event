import { Progress } from "@/components/ui/progress";

export function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="space-y-1">
      <div className="text-xs text-zinc-400">{pct}%</div>
      <Progress value={pct} />
    </div>
  );
}
