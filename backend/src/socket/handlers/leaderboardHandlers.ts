import { Domain } from "@prisma/client";
import { Server } from "socket.io";
import {
  DomainLeaderboardUpdatedEvent,
  FinalsLeaderboardUpdatedEvent,
  LabLeaderboardUpdatedEvent
} from "../../types/events";
import { rooms } from "../rooms";

export function emitLabLeaderboard(io: Server, payload: LabLeaderboardUpdatedEvent): void {
  io.of("/broadcast").to(rooms.lab(payload.labId)).emit("leaderboard:lab_updated", payload);
  io.of("/judges").to(rooms.lab(payload.labId)).emit("leaderboard:lab_updated", payload);
}

export function emitDomainLeaderboard(io: Server, domain: Domain, payload: DomainLeaderboardUpdatedEvent): void {
  io.of("/broadcast").to(rooms.domainLeaderboard(domain)).emit("leaderboard:domain_updated", payload);
  io.of("/judges").to(rooms.domainLeaderboard(domain)).emit("leaderboard:domain_updated", payload);
}

export function emitFinalsLeaderboard(io: Server, domain: Domain, payload: FinalsLeaderboardUpdatedEvent): void {
  io.of("/broadcast").to(rooms.finalsLeaderboard(domain)).emit("leaderboard:finals_updated", payload);
  io.of("/judges").to(rooms.finalsLeaderboard(domain)).emit("leaderboard:finals_updated", payload);
}
