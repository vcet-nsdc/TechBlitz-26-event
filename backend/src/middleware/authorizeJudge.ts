import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/errors";
import { AuthUser } from "../types/entities";

export async function authorizeJudge(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const user = request.user as AuthUser | undefined;
  if (!user || (user.role !== "judge" && user.role !== "admin")) {
    throw new AppError("Forbidden", 403);
  }
}
