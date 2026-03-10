import { FastifyPluginAsync } from "fastify";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { Server } from "socket.io";
import { setupBroadcastNamespace } from "../socket/namespaces/broadcastNamespace";
import { setupJudgeNamespace } from "../socket/namespaces/judgeNamespace";
import { setupParticipantNamespace } from "../socket/namespaces/participantNamespace";

const socketPlugin: FastifyPluginAsync = async (app) => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }

  const io = new Server(app.server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL,
      credentials: true
    }
  });

  const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  const judgesNamespace = io.of("/judges");
  const participantsNamespace = io.of("/participants");
  const broadcastNamespace = io.of("/broadcast");

  setupJudgeNamespace(app, judgesNamespace);
  setupParticipantNamespace(app, participantsNamespace);
  setupBroadcastNamespace(broadcastNamespace);

  app.decorate("io", io);

  app.addHook("onClose", async () => {
    io.removeAllListeners();
    await pubClient.quit();
    await subClient.quit();
    io.close();
  });
};

export default socketPlugin;
