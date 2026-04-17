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
      {/* Pitch markings */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 520"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer border */}
        <rect x="20" y="16" width="360" height="488" rx="2" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Halfway line */}
        <line x1="20" y1="260" x2="380" y2="260" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx="200" cy="260" r="46" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="200" cy="260" r="2" fill="white" fillOpacity="0.4" />

        {/* Top penalty area */}
        <rect x="110" y="16" width="180" height="76" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        {/* Top 6-yard box */}
        <rect x="155" y="16" width="90" height="30" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        {/* Top penalty arc */}
        <path d="M 155 92 Q 200 120 245 92" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
        {/* Top penalty spot */}
        <circle cx="200" cy="76" r="2" fill="white" fillOpacity="0.4" />

        {/* Bottom penalty area */}
        <rect x="110" y="428" width="180" height="76" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        {/* Bottom 6-yard box */}
        <rect x="155" y="474" width="90" height="30" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        {/* Bottom penalty arc */}
        <path d="M 155 428 Q 200 400 245 428" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
        {/* Bottom penalty spot */}
        <circle cx="200" cy="444" r="2" fill="white" fillOpacity="0.4" />

        {/* Grass stripe pattern */}
        {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="relative z-10 flex flex-col gap-3 py-5 px-2">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center items-end gap-2 flex-wrap">
            {row.map((id) => (
              <div key={id}>{renderPlayer(id)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
