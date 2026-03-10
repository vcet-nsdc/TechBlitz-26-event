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

  const isDev = process.env.NODE_ENV === "development";
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS;

  let corsOrigin: string[] | boolean;
  if (isDev) {
    corsOrigin = true;
  } else {
    const list: string[] = [];
    if (frontendUrl) list.push(frontendUrl);
    if (allowedOriginsRaw) {
      list.push(...allowedOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean));
    }
    corsOrigin = list.length > 0 ? [...new Set(list)] : false;
  }

  const io = new Server(app.server, {
    cors: {
      origin: corsOrigin,
      credentials: true
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000
  });

  const useTls = process.env.REDIS_TLS === "true";
  const redisOpts = {
    maxRetriesPerRequest: null as null,
    ...(useTls ? { tls: {} } : {})
  };
  const pubClient = new Redis(redisUrl, redisOpts);
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
