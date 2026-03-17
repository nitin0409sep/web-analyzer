"use client";

import { PerformanceMetric } from "@/lib/types";
import { Info } from "lucide-react";
import { useState } from "react";

interface MetricCardProps {
  metric: PerformanceMetric;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-zinc-400";
    if (score >= 0.9) return "text-perf-green";
    if (score >= 0.5) return "text-perf-yellow";
    return "text-perf-red";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-zinc-800";
    if (score >= 0.9) return "bg-green-500/10 border-green-500/20";
    if (score >= 0.5) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className={`relative rounded-xl border p-4 ${getScoreBg(metric.score)} transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wider">{metric.abbreviation}</p>
          <p className={`text-2xl font-bold mt-1 ${getScoreColor(metric.score)}`}>
            {metric.displayValue}
          </p>
          <p className="text-xs text-zinc-500 mt-1">{metric.title}</p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Info size={16} />
        </button>
      </div>
      {showInfo && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-zinc-400">{metric.description}</p>
        </div>
      )}
    </div>
  );
}
