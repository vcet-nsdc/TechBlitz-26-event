import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";
import { createLogger } from "../lib/logger";

const log = createLogger("prisma");

const prismaPlugin: FastifyPluginAsync = async (app) => {
  const isDev = process.env.NODE_ENV === "development";

  const prisma = new PrismaClient({
    log: isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "warn" },
          { emit: "stdout", level: "error" }
        ]
      : [
          { emit: "event", level: "warn" },
          { emit: "stdout", level: "error" }
        ]
  });

  if (isDev) {
    (prisma.$on as Function)("query", (e: { query: string; duration: number }) => {
      log.debug({ query: e.query, duration: `${e.duration}ms` }, "Prisma query");
    });
  }

  (prisma.$on as Function)("warn", (e: { message: string }) => {
    log.warn({ message: e.message }, "Prisma warning");
  });

  try {
    await prisma.$connect();
    log.info("Prisma connected to database");
  } catch (err) {
    log.error({ err }, "Failed to connect to database");
    process.exit(1);
  }

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    log.info("Disconnecting Prisma");
    await prisma.$disconnect();
  });
};

export default prismaPlugin;
