import { FastifyInstance } from "fastify";
import { Namespace } from "socket.io";
import { rooms } from "../rooms";
import { AuthUser } from "../../types/entities";

export function setupParticipantNamespace(app: FastifyInstance, namespace: Namespace): void {
  namespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        return next(new Error("Missing token"));
      }
      const user = (await app.jwt.verify(token)) as AuthUser;
      if (!user || user.role !== "participant") {
        return next(new Error("Unauthorized"));
      }
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  namespace.on("connection", (socket) => {
    socket.on("participant:join_team", (payload: { teamId: string }) => {
      socket.join(rooms.team(payload.teamId));
    });
  });
}
