import { FastifyPluginAsync } from "fastify";
import fastifyJwt from "@fastify/jwt";

const jwtPlugin: FastifyPluginAsync = async (app) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be configured");
  }

  await app.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: process.env.JWT_EXPIRY ?? "12h"
    }
  });
};

export default jwtPlugin;
