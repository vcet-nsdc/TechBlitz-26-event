import { FastifyInstance } from "fastify";
import { Domain } from "@prisma/client";
import { Namespace } from "socket.io";
import { rooms } from "../rooms";
import { AuthUser } from "../../types/entities";

export function setupJudgeNamespace(app: FastifyInstance, namespace: Namespace): void {
  namespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        return next(new Error("Missing token"));
      }
      const user = (await app.jwt.verify(token)) as AuthUser;
      if (!user || (user.role !== "judge" && user.role !== "admin")) {
        return next(new Error("Unauthorized"));
      }
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  namespace.on("connection", (socket) => {
    socket.on("judge:join_lab", (payload: { labId: string }) => {
      socket.join(rooms.lab(payload.labId));
    });

    socket.on("judge:join_domain", (payload: { domain: string }) => {
      const domain = payload.domain as Domain;
      socket.join(rooms.domainLeaderboard(domain));
      socket.join(rooms.finalsLeaderboard(domain));
    });
  });
}
