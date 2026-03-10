import { Progress } from "@/components/ui/progress";

export function ProgressTracker({
  registered,
  submitted,
  scored
}: {
  registered: boolean;
  submitted: boolean;
  scored: boolean;
}) {
  const percent = scored ? 100 : submitted ? 66 : registered ? 33 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>Registered</span>
        <span>Submitted</span>
        <span>Scored</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
