import { FastifyPluginAsync } from "fastify";
import { Queue } from "bullmq";

const bullmqPlugin: FastifyPluginAsync = async (app) => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }
  const connection = { url: redisUrl };
  const scoreQueue = new Queue("score-processing", { connection });
  const submissionQueue = new Queue("submission-validation", { connection });

  app.decorate("scoreQueue", scoreQueue);
  app.decorate("submissionQueue", submissionQueue);

  app.addHook("onClose", async () => {
    await scoreQueue.close();
    await submissionQueue.close();
  });
};

export default bullmqPlugin;
