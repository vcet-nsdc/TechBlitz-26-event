import { EventPhase } from "@/types/entities";
import { create } from "zustand";

type EventStore = {
  phase: EventPhase;
  setPhase: (phase: EventPhase) => void;
};

export const useEventStore = create<EventStore>((set) => ({
  phase: "REGISTRATION",
  setPhase: (phase) => set({ phase })
}));
