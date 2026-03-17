"use client";

import { DiagnosticItem } from "@/lib/types";
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useState } from "react";

interface DiagnosticCardProps {
  diagnostic: DiagnosticItem;
}

export default function DiagnosticCard({ diagnostic }: DiagnosticCardProps) {
  const [expanded, setExpanded] = useState(false);

  const impactConfig = {
    high: { icon: AlertTriangle, color: "text-perf-red", bg: "bg-red-500/10 border-red-500/20", label: "High Impact" },
    medium: { icon: AlertCircle, color: "text-perf-yellow", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Medium Impact" },
    low: { icon: Info, color: "text-perf-green", bg: "bg-green-500/10 border-green-500/20", label: "Low Impact" },
  };

  const config = impactConfig[diagnostic.impact];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.bg} transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        <Icon className={`${config.color} mt-0.5 shrink-0`} size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{diagnostic.title}</span>
            {diagnostic.savings && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                {diagnostic.savings}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${config.color}`}>{config.label}</span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-500">Affects: {diagnostic.metric}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="text-zinc-500 shrink-0" size={18} />
        ) : (
          <ChevronDown className="text-zinc-500 shrink-0" size={18} />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-xs font-medium text-zinc-400 mb-1">Why this happens</p>
            <p className="text-sm text-zinc-300">{diagnostic.cause}</p>
          </div>
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-xs font-medium text-accent-light mb-1">How to fix</p>
            <p className="text-sm text-zinc-300">{diagnostic.solution}</p>
          </div>
        </div>
      )}
    </div>
  );
}
