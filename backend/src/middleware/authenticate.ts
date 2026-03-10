import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";
import { AuthError, ForbiddenError } from "../lib/errors";
import { AuthRole, AuthUser } from "../types/entities";

export function authenticate(allowedRoles?: AuthRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    (request as unknown as { requestId: string }).requestId =
      (request.headers["x-request-id"] as string) ?? randomUUID();

    let token: string | undefined;
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token) {
      const cookies = request.cookies as Record<string, string> | undefined;
      token = cookies?.["__Secure-access-token"] ?? cookies?.["access-token"];
    }

    if (!token) {
      throw new AuthError("Missing authentication token");
    }

    try {
      await request.jwtVerify({ onlyCookie: false });
    } catch {
      try {
        const decoded = request.server.jwt.verify<AuthUser>(token);
        (request as unknown as { user: AuthUser }).user = decoded;
      } catch {
        throw new AuthError("Invalid or expired token");
      }
    }

    const user = request.user as AuthUser | undefined;
    if (!user) {
      throw new AuthError("Unauthorized");
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
  };
}
