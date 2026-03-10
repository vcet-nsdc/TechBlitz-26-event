import { FastifyPluginAsync } from "fastify";
import Redis from "ioredis";
import { createLogger } from "../lib/logger";

const log = createLogger("redis");

const redisPlugin: FastifyPluginAsync = async (app) => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }

  const useTls = process.env.REDIS_TLS === "true";
  const maxAttempts = Number(process.env.REDIS_RETRY_ATTEMPTS ?? 5);
  const baseDelay = Number(process.env.REDIS_RETRY_DELAY ?? 500);

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    lazyConnect: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
    ...(useTls ? { tls: {} } : {}),
    retryStrategy(times: number) {
      if (times > maxAttempts) {
        log.error({ attempts: times }, "Redis max retry attempts exceeded");
        return null;
      }
      const delay = Math.min(baseDelay * Math.pow(2, times - 1), 30000);
      const jitter = Math.random() * delay * 0.1;
      return Math.round(delay + jitter);
    }
  });

  redis.on("error", (err) => {
    log.error({ err }, "Redis connection error");
  });

  redis.on("ready", () => {
    log.info({ url: redisUrl.replace(/\/\/.*@/, "//<redacted>@") }, "Redis connected");
  });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
};

export default redisPlugin;
