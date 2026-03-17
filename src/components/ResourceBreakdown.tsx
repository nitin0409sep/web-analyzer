"use client";

import { formatBytes } from "@/lib/format";

interface ResourceBreakdownProps {
  resourceSummary: {
    totalSize: number;
    totalRequests: number;
    breakdown: Record<string, { size: number; count: number }>;
  };
}

const RESOURCE_LABELS: Record<string, string> = {
  script: "JavaScript",
  stylesheet: "CSS",
  image: "Images",
  font: "Fonts",
  document: "HTML",
  other: "Other",
  media: "Media",
  "third-party": "Third-party",
};

const RESOURCE_COLORS: Record<string, string> = {
  script: "bg-yellow-500",
  stylesheet: "bg-blue-500",
  image: "bg-green-500",
  font: "bg-purple-500",
  document: "bg-orange-500",
  other: "bg-zinc-500",
  media: "bg-pink-500",
  "third-party": "bg-red-500",
};

export default function ResourceBreakdown({ resourceSummary }: ResourceBreakdownProps) {
  const { totalSize, totalRequests, breakdown } = resourceSummary;

  const sorted = Object.entries(breakdown)
    .filter(([, v]) => v.size > 0)
    .sort(([, a], [, b]) => b.size - a.size);

  return (
    <div className="rounded-xl border border-card-border bg-card p-6">
      <h3 className="text-lg font-semibold mb-1">Resource Breakdown</h3>
      <p className="text-xs text-zinc-500 mb-4">
        This shows how much data your page downloads, broken down by type. Smaller pages load faster, especially on mobile networks.
      </p>

      <div className="flex gap-6 mb-6">
        <div>
          <p className="text-2xl font-bold text-accent-light">{formatBytes(totalSize)}</p>
          <p className="text-xs text-zinc-500">Total Transfer Size</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-accent-light">{totalRequests}</p>
          <p className="text-xs text-zinc-500">Total Requests</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-4 rounded-full overflow-hidden flex bg-zinc-800 mb-4">
        {sorted.map(([type, data]) => (
          <div
            key={type}
            className={`${RESOURCE_COLORS[type] || "bg-zinc-600"} transition-all`}
            style={{ width: `${(data.size / totalSize) * 100}%` }}
            title={`${RESOURCE_LABELS[type] || type}: ${formatBytes(data.size)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {sorted.map(([type, data]) => (
          <div key={type} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${RESOURCE_COLORS[type] || "bg-zinc-600"}`} />
              <span className="text-zinc-300">{RESOURCE_LABELS[type] || type}</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>{formatBytes(data.size)}</span>
              <span className="text-zinc-600 w-16 text-right">{data.count} req</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
