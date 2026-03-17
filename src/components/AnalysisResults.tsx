"use client";

import { AnalysisResult } from "@/lib/types";
import { CheckCircle, ExternalLink } from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import MetricCard from "./MetricCard";
import DiagnosticCard from "./DiagnosticCard";
import ResourceBreakdown from "./ResourceBreakdown";
import BundleSizeCard from "./BundleSizeCard";

interface AnalysisResultsProps {
  result: AnalysisResult;
  strategyLabel: string;
}

export default function AnalysisResults({ result, strategyLabel }: AnalysisResultsProps) {
  return (
    <div className="space-y-8">
      {/* Overall Score + Bundle Size + Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-card-border bg-card p-6 flex flex-col items-center">
          <div className="relative">
            <ScoreGauge score={result.overallScore} size={140} />
          </div>
          <p className="text-sm font-medium mt-2">Performance Score</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-light hover:underline mt-2 flex items-center gap-1"
          >
            {result.url} <ExternalLink size={10} />
          </a>
          <p className="text-xs text-zinc-600 mt-1">
            {strategyLabel} | {new Date(result.fetchTime).toLocaleString()}
          </p>
          <div className="mt-3 pt-3 border-t border-white/5 w-full">
            <p className="text-xs text-zinc-500 text-center">
              {result.overallScore >= 90
                ? "Excellent! Your site loads fast and feels snappy."
                : result.overallScore >= 50
                  ? "Decent, but there's room to make it faster."
                  : "Your site feels slow to visitors. See the recommendations below to fix it."}
            </p>
          </div>
        </div>

        {result.resourceSummary && (
          <BundleSizeCard resourceSummary={result.resourceSummary} />
        )}

        {result.screenshot && (
          <div className="rounded-xl border border-card-border bg-card p-4">
            <p className="text-xs text-zinc-500 mb-2">Final Screenshot</p>
            <img
              src={result.screenshot}
              alt="Page screenshot"
              className="rounded-lg w-full max-w-md mx-auto"
            />
            <p className="text-xs text-zinc-500 mt-2 text-center">
              This is what your page looks like when it finishes loading.
            </p>
          </div>
        )}
      </div>

      {/* Core Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Core Web Vitals & Metrics</h2>
        <p className="text-xs text-zinc-500 mb-4">
          These are the key measurements Google uses to evaluate how fast and smooth your website feels.
          Click the <span className="text-zinc-400">info icon</span> on any metric to learn what it means and what&apos;s a good score.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {result.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Resource Breakdown */}
      {result.resourceSummary && (
        <ResourceBreakdown resourceSummary={result.resourceSummary} />
      )}

      {/* Diagnostics */}
      {result.diagnostics.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-1">Issues & Recommendations</h2>
          <p className="text-xs text-zinc-500 mb-1">
            These are specific problems slowing down your site, sorted by impact. Click any issue to see why it happens and how to fix it.
          </p>
          <p className="text-sm text-zinc-500 mb-4">
            {result.diagnostics.filter((d) => d.impact === "high").length} high impact,{" "}
            {result.diagnostics.filter((d) => d.impact === "medium").length} medium,{" "}
            {result.diagnostics.filter((d) => d.impact === "low").length} low
          </p>
          <div className="space-y-2">
            {result.diagnostics.map((diagnostic, i) => (
              <DiagnosticCard key={i} diagnostic={diagnostic} />
            ))}
          </div>
        </div>
      )}

      {/* Passed Audits */}
      {result.passedAudits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-1">
            Passed Audits ({result.passedAudits.length})
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Things your site already does well. No action needed here.
          </p>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="space-y-2">
              {result.passedAudits.map((audit) => (
                <div key={audit.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="text-perf-green shrink-0" size={14} />
                  <span className="text-zinc-300">{audit.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
