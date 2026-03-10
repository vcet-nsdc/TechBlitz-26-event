"use client";

import { LeaderboardEntry } from "@/types/entities";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { RankChangeIndicator } from "./RankChangeIndicator";
import { ScoreBar } from "./ScoreBar";

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const [debounced, setDebounced] = useState(entries);
  const prevRanks = useRef<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(entries), 800);
    return () => clearTimeout(timer);
  }, [entries]);

  const rankMap = useMemo(() => {
    const map = { ...prevRanks.current };
    debounced.forEach((entry) => {
      map[entry.teamId] = map[entry.teamId] ?? entry.rank;
    });
    return map;
  }, [debounced]);

  useEffect(() => {
    debounced.forEach((entry) => {
      prevRanks.current[entry.teamId] = entry.rank;
    });
  }, [debounced]);

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {debounced.map((entry) => (
          <motion.div
            key={entry.teamId}
            layoutId={entry.teamId}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-[64px_1fr_120px_56px] items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <div className="text-2xl font-bold">#{entry.rank}</div>
            <div>
              <div className="text-xl font-semibold text-zinc-100">{entry.teamName}</div>
              <div className="text-sm text-zinc-400">Team ID: {entry.teamId.slice(0, 8)}</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-100">{entry.totalScore.toFixed(2)}</div>
              <ScoreBar score={entry.totalScore} />
            </div>
            <RankChangeIndicator previousRank={rankMap[entry.teamId]} currentRank={entry.rank} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
