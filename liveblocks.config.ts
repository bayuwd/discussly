import type { Topic } from "@/lib/topics";
import type { TimerStatus } from "@/lib/store";

declare global {
  interface Liveblocks {
    Storage: {
      topic: Topic | null;
      timerEndAt: number | null;
      timerStatus: TimerStatus;
      timerDurationSec: number;
      timerRemainingSec: number | null;
      timerStarterId: number | null;
    };
    Presence: {
      cursor: { x: number; y: number } | null;
    };
    UserMeta: {};
    RoomEvent: {};
  }
}
export {};
