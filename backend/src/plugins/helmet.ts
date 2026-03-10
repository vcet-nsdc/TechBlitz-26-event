import { FastifyPluginAsync } from "fastify";
import fastifyHelmet from "@fastify/helmet";

const helmetPlugin: FastifyPluginAsync = async (app) => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const isProd = process.env.NODE_ENV === "production";

  await app.register(fastifyHelmet, {
    global: true,
    hidePoweredBy: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", frontendUrl, "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        ...(isProd ? { upgradeInsecureRequests: [] } : {})
      }
    }
  });
};

export default helmetPlugin;
