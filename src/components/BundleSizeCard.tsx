"use client";

import { formatBytes } from "@/lib/format";
import { Package, Info } from "lucide-react";
import { useState } from "react";

interface BundleSizeCardProps {
  resourceSummary: {
    totalSize: number;
    totalRequests: number;
    breakdown: Record<string, { size: number; count: number }>;
  };
}

function getSizeRating(bytes: number): { label: string; color: string; bg: string } {
  const kb = bytes / 1024;
  if (kb < 200) return { label: "Lean", color: "text-perf-green", bg: "bg-green-500/10 border-green-500/20" };
  if (kb < 500) return { label: "Moderate", color: "text-perf-yellow", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { label: "Heavy", color: "text-perf-red", bg: "bg-red-500/10 border-red-500/20" };
}

export default function BundleSizeCard({ resourceSummary }: BundleSizeCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { totalSize, breakdown } = resourceSummary;

  const jsSize = breakdown.script?.size || 0;
  const cssSize = breakdown.stylesheet?.size || 0;
  const imageSize = breakdown.image?.size || 0;
  const bundleSize = jsSize + cssSize;

  const rating = getSizeRating(bundleSize);

  return (
    <div className={`rounded-xl border ${rating.bg} p-5 flex-1`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className={rating.color} size={18} />
          <h3 className="text-sm font-semibold text-zinc-300">Bundle Size</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Info size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className={`text-3xl font-bold ${rating.color}`}>{formatBytes(bundleSize)}</p>
          <p className="text-xs text-zinc-500 mt-0.5">JS + CSS transferred</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
          <div>
            <p className="text-sm font-semibold text-yellow-400">{formatBytes(jsSize)}</p>
            <p className="text-xs text-zinc-500">JavaScript</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-400">{formatBytes(cssSize)}</p>
            <p className="text-xs text-zinc-500">CSS</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-400">{formatBytes(imageSize)}</p>
            <p className="text-xs text-zinc-500">Images</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Total page weight</span>
            <span className="text-zinc-300 font-medium">{formatBytes(totalSize)}</span>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <p className="text-xs text-zinc-300">
            Bundle size is the total amount of JavaScript and CSS your page downloads. Smaller bundles mean faster page loads.
          </p>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-perf-green shrink-0" />
              <span className="text-zinc-400">Under 200 KB -- fast on most connections</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-perf-yellow shrink-0" />
              <span className="text-zinc-400">200-500 KB -- acceptable, but can be improved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-perf-red shrink-0" />
              <span className="text-zinc-400">Over 500 KB -- slow on mobile, needs optimization</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 italic">
            Tip: Use code splitting, tree shaking, and lazy loading to reduce bundle size. Remove unused dependencies.
          </p>
        </div>
      )}
    </div>
  );
}
