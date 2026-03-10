import { Domain, UserRole } from "@/types/entities";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      domain?: Domain;
      assignedLabs?: string[];
      teamId?: string;
      backendToken?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    domain?: Domain;
    assignedLabs?: string[];
    teamId?: string;
    backendToken?: string;
  }
}
