import { FastifyPluginAsync } from "fastify";
import fastifyCors from "@fastify/cors";

const corsPlugin: FastifyPluginAsync = async (app) => {
  const allowedOrigin = process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!allowedOrigin) {
    throw new Error("FRONTEND_URL (or NEXT_PUBLIC_FRONTEND_URL) must be set");
  }

  await app.register(fastifyCors, {
    origin: [allowedOrigin],
    credentials: true
  });
};

export default corsPlugin;
