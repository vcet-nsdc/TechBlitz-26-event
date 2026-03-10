import { FastifyRequest } from "fastify";

export const scoreRateLimitConfig = {
  rateLimit: {
    max: 10,
    timeWindow: "1 minute",
    keyGenerator: (request: FastifyRequest): string =>
      (request.user as { id?: string } | undefined)?.id ?? "anonymous"
  }
};
