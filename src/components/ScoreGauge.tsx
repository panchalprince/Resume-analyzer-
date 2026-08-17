import React from "react";
import { getScoreColor } from "../lib/utils.js";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = "lg",
  showLabel = true,
  label = "ATS Score",
  sublabel,
  animate = true,
}) => {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));
  const colors = getScoreColor(clampedScore);

  const sizeMap = {
    sm: { dimension: 80, stroke: 7, fontSize: "text-lg", labelSize: "text-xs" },
    md: { dimension: 120, stroke: 10, fontSize: "text-2xl", labelSize: "text-xs" },
    lg: { dimension: 160, stroke: 12, fontSize: "text-4xl", labelSize: "text-sm" },
    xl: { dimension: 200, stroke: 14, fontSize: "text-5xl", labelSize: "text-base" },
  };

  const currentSize = sizeMap[size];
  const radius = (currentSize.dimension - currentSize.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={currentSize.dimension}
          height={currentSize.dimension}
          className="transform -rotate-90"
        >
          {/* Background Ring */}
          <circle
            cx={currentSize.dimension / 2}
            cy={currentSize.dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={currentSize.stroke}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx={currentSize.dimension / 2}
            cy={currentSize.dimension / 2}
            r={radius}
            stroke={colors.hex}
            strokeWidth={currentSize.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: animate ? "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease" : "none",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.fontSize}`}>
            {clampedScore}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            / 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2.5 flex flex-col items-center">
          <span className={`font-semibold text-slate-800 dark:text-slate-200 ${currentSize.labelSize}`}>
            {label}
          </span>
          {sublabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[180px]">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
