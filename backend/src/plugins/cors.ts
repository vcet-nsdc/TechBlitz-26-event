import { FastifyPluginAsync } from "fastify";
import fastifyCors from "@fastify/cors";

const corsPlugin: FastifyPluginAsync = async (app) => {
  const isDev = process.env.NODE_ENV === "development";
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS;

  let origins: string[] | boolean;
  if (isDev) {
    origins = true;
  } else {
    const list: string[] = [];
    if (frontendUrl) list.push(frontendUrl);
    if (allowedOriginsRaw) {
      list.push(...allowedOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean));
    }
    if (list.length === 0) {
      throw new Error("FRONTEND_URL or ALLOWED_ORIGINS must be set in production");
    }
    origins = [...new Set(list)];
  }

  await app.register(fastifyCors, {
    origin: origins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: true,
    maxAge: 86400
  });
};

export default corsPlugin;
