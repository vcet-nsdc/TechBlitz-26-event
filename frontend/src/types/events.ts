import { Domain, EventPhase, LeaderboardEntry, SubmissionStatus } from "./entities";

export type SubmissionStatusChangedEvent = {
  teamId: string;
  status: SubmissionStatus;
  url: string;
};

export type LeaderboardLabUpdatedEvent = {
  labId: string;
  entries: LeaderboardEntry[];
  timestamp: string;
};

export type LeaderboardDomainUpdatedEvent = {
  domain: Domain;
  entries: LeaderboardEntry[];
  timestamp: string;
};

export type LeaderboardFinalsUpdatedEvent = {
  domain: Domain;
  entries: LeaderboardEntry[];
  timestamp: string;
};

export type EventPhaseChangedEvent = {
  phase: EventPhase;
};
