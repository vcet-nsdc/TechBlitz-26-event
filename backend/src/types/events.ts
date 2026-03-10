import { Domain, EventPhase, SubmissionStatus } from "@prisma/client";
import { LeaderboardRow } from "./entities";

export type LabLeaderboardUpdatedEvent = {
  labId: string;
  entries: LeaderboardRow[];
  timestamp: string;
};

export type DomainLeaderboardUpdatedEvent = {
  domain: Domain;
  entries: LeaderboardRow[];
  timestamp: string;
};

export type FinalsLeaderboardUpdatedEvent = {
  domain: Domain;
  entries: LeaderboardRow[];
  timestamp: string;
};

export type ScoreAcceptedEvent = {
  scoreId: string;
  teamId: string;
  updatedAggregate: number;
};

export type SubmissionStatusChangedEvent = {
  teamId: string;
  status: SubmissionStatus;
  url: string;
};

export type RoundFinalsStartedEvent = {
  domain: Domain;
  qualifiedTeams: Array<{ teamId: string; teamName: string; labScore: number }>;
};

export type RoundLockedEvent = {
  round: string;
  domain?: Domain;
};

export type EventPhaseChangedEvent = {
  phase: EventPhase;
};
