import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/errors";
import { AuthRole, AuthUser } from "../types/entities";

export function authenticate(allowedRoles?: AuthRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    await request.jwtVerify();
    const user = request.user as AuthUser | undefined;
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new AppError("Forbidden", 403);
    }
  };
}
