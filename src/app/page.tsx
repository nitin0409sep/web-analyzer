"use client";

import { useState } from "react";
import { Search, Loader2, Monitor, Smartphone, CheckCircle, ExternalLink } from "lucide-react";
import { AnalysisResult } from "@/lib/types";
import ScoreGauge from "@/components/ScoreGauge";
import MetricCard from "@/components/MetricCard";
import DiagnosticCard from "@/components/DiagnosticCard";
import ResourceBreakdown from "@/components/ResourceBreakdown";

export default function Home() {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), strategy }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to connect to the analysis service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b border-card-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">
            <span className="text-accent-light">WebPerf</span> Analyzer
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Analyze website performance with actionable insights
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={analyze} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., example.com)"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-card-border focus:border-accent focus:outline-none text-sm placeholder:text-zinc-600"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex rounded-xl border border-card-border overflow-hidden">
              <button
                type="button"
                onClick={() => setStrategy("mobile")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  strategy === "mobile" ? "bg-accent text-white" : "bg-card text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone size={14} />
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setStrategy("desktop")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  strategy === "desktop" ? "bg-accent text-white" : "bg-card text-zinc-400 hover:text-white"
                }`}
              >
                <Monitor size={14} />
                Desktop
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="mt-12 text-center">
            <Loader2 className="animate-spin mx-auto text-accent" size={40} />
            <p className="text-zinc-400 mt-4">Running Lighthouse analysis locally...</p>
            <p className="text-zinc-600 text-sm mt-1">This usually takes 15-30 seconds</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-8">
            {/* Overall Score + Screenshot */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
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
                  {strategy === "mobile" ? "Mobile" : "Desktop"} | {new Date(result.fetchTime).toLocaleString()}
                </p>
              </div>

              {result.screenshot && (
                <div className="rounded-xl border border-card-border bg-card p-4 flex-1">
                  <p className="text-xs text-zinc-500 mb-2">Final Screenshot</p>
                  <img
                    src={result.screenshot}
                    alt="Page screenshot"
                    className="rounded-lg w-full max-w-md mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Core Metrics */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Core Web Vitals & Metrics</h2>
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
                <h2 className="text-lg font-semibold mb-2">Issues & Recommendations</h2>
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
                <h2 className="text-lg font-semibold mb-4">
                  Passed Audits ({result.passedAudits.length})
                </h2>
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

            {/* Score Legend */}
            <div className="rounded-xl border border-card-border bg-card p-4 text-xs text-zinc-500">
              <p className="font-medium text-zinc-400 mb-2">Score Guide</p>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-perf-green" /> 90-100: Good
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-perf-yellow" /> 50-89: Needs Improvement
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-perf-red" /> 0-49: Poor
                </span>
              </div>
              <p className="mt-2">
                Powered by Lighthouse (running locally). Results may vary between runs.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="mt-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Search className="text-accent" size={28} />
            </div>
            <h2 className="text-xl font-semibold">Analyze Any Website</h2>
            <p className="text-zinc-500 mt-2 max-w-md mx-auto text-sm">
              Enter a public URL to get detailed performance metrics, identify bottlenecks,
              and get actionable recommendations to improve speed.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["google.com", "github.com", "vercel.com"].map((site) => (
                <button
                  key={site}
                  onClick={() => setUrl(site)}
                  className="px-3 py-1.5 rounded-lg bg-card border border-card-border text-sm text-zinc-400 hover:text-white hover:border-accent transition-colors"
                >
                  {site}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
