import { Namespace } from "socket.io";
import { Domain } from "@prisma/client";
import { rooms } from "../rooms";

export function setupBroadcastNamespace(namespace: Namespace): void {
  namespace.on("connection", (socket) => {
    socket.on("broadcast:join_lab", (payload: { labId: string }) => {
      socket.join(rooms.lab(payload.labId));
    });

    socket.on("broadcast:join_domain", (payload: { domain: Domain }) => {
      socket.join(rooms.domainLeaderboard(payload.domain));
      socket.join(rooms.finalsLeaderboard(payload.domain));
    });
  });
}
