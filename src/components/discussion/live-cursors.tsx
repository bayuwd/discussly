"use client";

import { useOthers } from "@liveblocks/react";
import { MousePointer2 } from "lucide-react";

// Vibrant colors for the cursors
const COLORS = [
  "#E81416",
  "#FFA500",
  "#FAEB36",
  "#79C314",
  "#487DE7",
  "#4B369D",
  "#70369D",
];

export function LiveCursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (presence == null || presence.cursor == null) {
          return null;
        }

        const color = COLORS[connectionId % COLORS.length];

        return (
          <div
            key={connectionId}
            className="pointer-events-none absolute left-0 top-0 z-50 transition-all duration-100 ease-out"
            style={{
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px)`,
            }}
          >
            <MousePointer2
              className="size-5"
              fill={color}
              color={color}
            />
          </div>
        );
      })}
    </>
  );
}
