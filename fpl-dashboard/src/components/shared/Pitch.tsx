"use client";

import React from "react";

interface PitchProps {
  rows: number[][];
  renderPlayer: (id: number) => React.ReactNode;
}

export function Pitch({ rows, renderPlayer }: PitchProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-t-2xl border border-fpl-border"
      style={{ background: "#1a7a3c" }}
    >
      {/* Half-pitch markings (goal end to halfway line) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 280"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top half outer border */}
        <rect x="20" y="16" width="360" height="244" rx="2" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Center circle arc at halfway line (only top arc visible) */}
        <circle cx="200" cy="260" r="46" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Top penalty area */}
        <rect x="110" y="16" width="180" height="76" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        {/* Top 6-yard box */}
        <rect x="155" y="16" width="90" height="30" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        {/* Top penalty arc */}
        <path d="M 155 92 Q 200 120 245 92" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
        {/* Top penalty spot */}
        <circle cx="200" cy="76" r="2" fill="white" fillOpacity="0.4" />

        {/* Grass stripe pattern */}
        {Array.from({ length: 4 }).map((_, i) => (
          <rect
            key={i}
            x="20"
            y={16 + i * 61}
            width="360"
            height="30.5"
            fill="white"
            fillOpacity="0.03"
          />
        ))}
      </svg>

      {/* Player rows */}
      <div className="relative z-10 flex flex-col gap-6 py-7 px-4">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center items-end gap-5 flex-wrap">
            {row.map((id) => (
              <div key={id}>{renderPlayer(id)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
