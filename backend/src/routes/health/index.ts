import { FastifyPluginAsync } from "fastify";

let shuttingDown = false;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function setShuttingDown(value: boolean): void {
  shuttingDown = value;
}

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (_request, reply) => {
    if (isShuttingDown()) {
      return reply.status(503).send({ status: "shutting_down" });
    }

    const checks: Record<string, "ok" | "fail"> = { database: "ok", redis: "ok" };

    try {
      await Promise.race([
        app.prisma.$queryRawUnsafe("SELECT 1"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000))
      ]);
    } catch {
      checks.database = "fail";
    }

    try {
      await Promise.race([
        app.redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1000))
      ]);
    } catch {
      checks.redis = "fail";
    }

    const healthy = Object.values(checks).every((v) => v === "ok");
    const body = {
      status: healthy ? "ok" : "unhealthy",
      checks,
      uptime: process.uptime(),
      ...(healthy ? { version: process.env.npm_package_version ?? "1.0.0" } : {})
    };

    return reply.status(healthy ? 200 : 503).send(body);
  });

  app.get("/ready", async (_request, reply) => {
    return reply.status(200).send({ ready: true });
  });
};

export default healthRoutes;
