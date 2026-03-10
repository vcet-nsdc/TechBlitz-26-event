export type Domain = "UIUX" | "AGENTIC_AI" | "VIBE_CODING";
export type EventPhase = "REGISTRATION" | "LAB_ROUND" | "FINALS" | "CLOSED";
export type SubmissionType = "FIGMA_LINK" | "GITHUB_LINK";
export type SubmissionStatus = "PENDING" | "VALIDATING" | "VALID" | "INVALID";
export type UserRole = "participant" | "judge" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  domain?: Domain;
  assignedLabs?: string[];
  teamId?: string;
  token?: string;
};

export type Participant = {
  id: string;
  name: string;
  email: string;
  teamId?: string | null;
};

export type Submission = {
  id: string;
  teamId: string;
  type: SubmissionType;
  url: string;
  status: SubmissionStatus;
  submittedAt: string;
  validatedAt?: string | null;
};

export type PromptLog = {
  id: string;
  teamId: string;
  promptText: string;
  toolUsed?: string | null;
  loggedAt: string;
};

export type Judge = {
  id: string;
  name: string;
  email: string;
  domain: Domain;
  labs: { labId: string }[];
};

export type Team = {
  id: string;
  name: string;
  domain: Domain;
  inFinals: boolean;
  labId: string;
  lab?: { id: string; name: string; domain: Domain };
  participants: Participant[];
  submission?: Submission | null;
  scores?: Score[];
  scoreSummary?: Record<string, number>;
};

export type LeaderboardEntry = {
  teamId: string;
  teamName: string;
  totalScore: number;
  rank: number;
  labId?: string;
  domain?: Domain;
};

export type ScoreCriteria = {
  id: string;
  name: string;
  maxScore: number;
  domain: Domain;
  isFinal: boolean;
};

export type Score = {
  id: string;
  teamId: string;
  judgeId: string;
  criteriaId: string;
  round: string;
  value: number;
  criteria: ScoreCriteria;
  judge?: {
    id: string;
    name: string;
    email: string;
    domain: Domain;
  };
  submittedAt: string;
};
