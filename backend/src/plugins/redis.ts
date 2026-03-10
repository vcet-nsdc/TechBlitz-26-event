import { FastifyPluginAsync } from "fastify";
import Redis from "ioredis";

const redisPlugin: FastifyPluginAsync = async (app) => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
};

export default redisPlugin;
