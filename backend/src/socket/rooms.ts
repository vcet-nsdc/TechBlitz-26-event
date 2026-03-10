import { Domain } from "@prisma/client";

export const rooms = {
  lab: (labId: string): string => `lab:${labId}`,
  domainLeaderboard: (domain: Domain): string => `leaderboard:domain:${domain}`,
  finalsLeaderboard: (domain: Domain): string => `leaderboard:finals:${domain}`,
  team: (teamId: string): string => `team:${teamId}`
};
