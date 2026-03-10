import { EventPhase } from "@/types/entities";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ConnectionState = "connected" | "reconnecting" | "failed" | "disconnected";

type EventStore = {
  // Phase
  phase: EventPhase;
  setPhase: (phase: EventPhase) => void;

  // Connection state per namespace
  connections: Record<string, ConnectionState>;
  setConnected: (namespace: string, connected: boolean) => void;
  setConnectionFailed: (namespace: string) => void;

  // Pending room joins (for reconnect replay)
  pendingRooms: Record<string, string[]>;
  addPendingRoom: (namespace: string, room: string) => void;
  clearPendingRooms: (namespace: string) => void;
};

export const useEventStore = create<EventStore>()(
  persist(
    (set) => ({
      phase: "REGISTRATION",
      setPhase: (phase) => set({ phase }),

      connections: {},
      setConnected: (namespace, connected) =>
        set((state) => ({
          connections: {
            ...state.connections,
            [namespace]: connected ? "connected" : "reconnecting"
          }
        })),
      setConnectionFailed: (namespace) =>
        set((state) => ({
          connections: {
            ...state.connections,
            [namespace]: "failed"
          }
        })),

      pendingRooms: {},
      addPendingRoom: (namespace, room) =>
        set((state) => {
          const current = state.pendingRooms[namespace] ?? [];
          if (current.includes(room)) return state;
          return {
            pendingRooms: {
              ...state.pendingRooms,
              [namespace]: [...current, room]
            }
          };
        }),
      clearPendingRooms: (namespace) =>
        set((state) => ({
          pendingRooms: {
            ...state.pendingRooms,
            [namespace]: []
          }
        }))
    }),
    {
      name: "event-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      ),
      partialize: (state) => ({ phase: state.phase, pendingRooms: state.pendingRooms })
    }
  )
);
