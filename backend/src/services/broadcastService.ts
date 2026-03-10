import { Domain, EventPhase } from "@prisma/client";
import { Server } from "socket.io";
import { rooms } from "../socket/rooms";

export function emitPhaseChanged(io: Server, phase: EventPhase): void {
  io.of("/broadcast").emit("event:phase_changed", { phase });
  io.of("/judges").emit("event:phase_changed", { phase });
}

export function emitRoundLocked(io: Server, round: string, domain?: Domain): void {
  io.of("/broadcast").emit("round:locked", { round, domain });
  io.of("/judges").emit("round:locked", { round, domain });
}

export function emitFinalsStarted(
  io: Server,
  domain: Domain,
  qualifiedTeams: Array<{ teamId: string; teamName: string; labScore: number }>
): void {
  const payload = { domain, qualifiedTeams };
  io.of("/broadcast").to(rooms.finalsLeaderboard(domain)).emit("round:finals_started", payload);
  io.of("/judges").to(rooms.finalsLeaderboard(domain)).emit("round:finals_started", payload);
}
