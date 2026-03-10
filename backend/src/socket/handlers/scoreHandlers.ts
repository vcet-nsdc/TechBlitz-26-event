import { Server } from "socket.io";
import { ScoreAcceptedEvent, SubmissionStatusChangedEvent } from "../../types/events";
import { rooms } from "../rooms";

export function emitScoreAccepted(io: Server, payload: ScoreAcceptedEvent): void {
  io.of("/judges").emit("score:accepted", payload);
}

export function emitSubmissionStatus(io: Server, payload: SubmissionStatusChangedEvent): void {
  io.of("/participants").to(rooms.team(payload.teamId)).emit("submission:status_changed", payload);
  io.of("/judges").emit("submission:status_changed", payload);
}
