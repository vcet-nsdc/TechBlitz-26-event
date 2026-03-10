import { Domain } from "@prisma/client";

export type AuthRole = "judge" | "admin" | "participant";

export type AuthUser = {
  id: string;
  role: AuthRole;
  domain?: Domain;
  assignedLabs?: string[];
  teamId?: string;
  email?: string;
};

export type LeaderboardRow = {
  teamId: string;
  teamName: string;
  totalScore: number;
  rank: number;
};
