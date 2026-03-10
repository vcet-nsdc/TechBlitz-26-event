import { LeaderboardEntry } from "@/types/entities";

export function TopThreePodium({ entries }: { entries: LeaderboardEntry[] }) {
  const [first, second, third] = entries.slice(0, 3);
  const cards = [second, first, third].filter(Boolean) as LeaderboardEntry[];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((entry) => (
        <div key={entry.teamId} className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-center">
          <div className="text-4xl font-black text-indigo-300">#{entry.rank}</div>
          <div className="mt-2 text-2xl font-semibold">{entry.teamName}</div>
          <div className="text-zinc-400">{entry.totalScore.toFixed(2)} pts</div>
        </div>
      ))}
    </div>
  );
}
