"use client";

import { useState } from "react";
import { Search, Loader2, Monitor, Smartphone, BookOpen } from "lucide-react";
import { DualAnalysisResult } from "@/lib/types";
import AnalysisResults from "@/components/AnalysisResults";

const GLOSSARY = [
  {
    term: "Performance Score",
    meaning: "An overall rating from 0-100. It combines all the metrics below into a single number. 90+ is great, 50-89 needs work, below 50 is poor.",
  },
  {
    term: "FCP (First Contentful Paint)",
    meaning: "How quickly the first piece of content (text, image, etc.) appears on screen. A fast FCP reassures visitors that the page is loading.",
  },
  {
    term: "LCP (Largest Contentful Paint)",
    meaning: "How long until the biggest element (usually a hero image or heading) loads. This is the most important Core Web Vital -- it's when the user feels the page is \"ready.\"",
  },
  {
    term: "TBT (Total Blocking Time)",
    meaning: "How long the page was frozen and couldn't respond to your clicks or typing. Caused by heavy JavaScript. Lower is better.",
  },
  {
    term: "CLS (Cumulative Layout Shift)",
    meaning: "How much things jump around while loading (buttons moving, text shifting). A score of 0 means nothing moved -- perfect stability.",
  },
  {
    term: "SI (Speed Index)",
    meaning: "How quickly the visible content fills in. A page that shows content progressively feels faster than one that stays blank then loads all at once.",
  },
  {
    term: "TTI (Time to Interactive)",
    meaning: "How long until you can actually use the page -- click buttons, scroll smoothly, type in forms. The page might look ready before this.",
  },
  {
    term: "Bundle Size",
    meaning: "The total amount of JavaScript and CSS code your page downloads. Bigger bundles mean slower load times, especially on phones with slow connections.",
  },
  {
    term: "Transfer Size",
    meaning: "Total data downloaded to load the page, including images, fonts, scripts, and everything else. Think of it as the \"weight\" of your page.",
  },
  {
    term: "Requests",
    meaning: "The number of separate files your browser had to download. Each request adds overhead, so fewer requests generally means faster loading.",
  },
  {
    term: "Core Web Vitals",
    meaning: "Google's 3 key metrics (LCP, CLS, and a responsiveness metric) that directly affect your search ranking. Good scores here help your SEO.",
  },
  {
    term: "Mobile vs Desktop",
    meaning: "Mobile tests simulate a mid-range phone on a 4G connection (slower CPU, slower network). Desktop tests assume a fast computer on broadband. Mobile scores are almost always lower.",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DualAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"mobile" | "desktop">("mobile");
  const [showGlossary, setShowGlossary] = useState(false);

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout for dual

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), strategy: "both" }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      setResults(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Analysis timed out. The site may be too slow or unreachable.");
      } else {
        setError("Failed to connect to the analysis service. Make sure the dev server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const activeResult = results ? results[activeTab] : null;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b border-card-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-accent-light">WebPerf</span> Analyzer
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Analyze website performance with actionable insights
            </p>
          </div>
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-card-border text-sm text-zinc-400 hover:text-white hover:border-accent transition-colors"
          >
            <BookOpen size={16} />
            What do these terms mean?
          </button>
        </div>
      </div>

      {/* Glossary Panel */}
      {showGlossary && (
        <div className="border-b border-card-border bg-card/80">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">Glossary -- Understanding Your Results</h2>
            <p className="text-sm text-zinc-500 mb-4">
              New to web performance? Here&apos;s what every term means in plain language.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GLOSSARY.map((item) => (
                <div key={item.term} className="rounded-lg bg-black/20 p-3">
                  <p className="text-sm font-medium text-accent-light">{item.term}</p>
                  <p className="text-xs text-zinc-400 mt-1">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
        </form>

        {/* Loading state */}
        {loading && (
          <div className="mt-12 text-center">
            <Loader2 className="animate-spin mx-auto text-accent" size={40} />
            <p className="text-zinc-400 mt-4">Running Lighthouse analysis for both mobile and desktop...</p>
            <p className="text-zinc-600 text-sm mt-1">This usually takes 30-60 seconds</p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Smartphone size={12} /> Mobile analysis
              </span>
              <span>+</span>
              <span className="flex items-center gap-1.5">
                <Monitor size={12} /> Desktop analysis
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-8">
            {/* Mobile / Desktop Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-card-border">
              <button
                onClick={() => setActiveTab("mobile")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "mobile"
                    ? "border-accent text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Smartphone size={16} />
                Mobile
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    results.mobile.overallScore >= 90
                      ? "bg-green-500/20 text-perf-green"
                      : results.mobile.overallScore >= 50
                        ? "bg-yellow-500/20 text-perf-yellow"
                        : "bg-red-500/20 text-perf-red"
                  }`}
                >
                  {results.mobile.overallScore}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("desktop")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "desktop"
                    ? "border-accent text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Monitor size={16} />
                Desktop
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    results.desktop.overallScore >= 90
                      ? "bg-green-500/20 text-perf-green"
                      : results.desktop.overallScore >= 50
                        ? "bg-yellow-500/20 text-perf-yellow"
                        : "bg-red-500/20 text-perf-red"
                  }`}
                >
                  {results.desktop.overallScore}
                </span>
              </button>

              {/* Score comparison hint */}
              <div className="ml-auto text-xs text-zinc-500 hidden sm:block">
                {results.desktop.overallScore > results.mobile.overallScore
                  ? `Desktop is ${results.desktop.overallScore - results.mobile.overallScore} points faster`
                  : results.mobile.overallScore > results.desktop.overallScore
                    ? `Mobile is ${results.mobile.overallScore - results.desktop.overallScore} points faster`
                    : "Both score equally"}
              </div>
            </div>

            {/* Active tab explanation */}
            <div className="mb-6 p-3 rounded-lg bg-card/50 border border-card-border">
              <p className="text-xs text-zinc-400">
                {activeTab === "mobile" ? (
                  <>
                    <span className="font-medium text-zinc-300">Mobile view:</span> Simulates a mid-range phone on a 4G connection with slower CPU. This is how most of your visitors experience your site -- over 60% of web traffic comes from mobile devices.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-zinc-300">Desktop view:</span> Simulates a computer on a fast broadband connection. Desktop scores are usually higher because desktops have faster processors and better network speeds.
                  </>
                )}
              </p>
            </div>

            {activeResult && (
              <AnalysisResults
                result={activeResult}
                strategyLabel={activeTab === "mobile" ? "Mobile" : "Desktop"}
              />
            )}

            {/* Score Legend */}
            <div className="mt-8 rounded-xl border border-card-border bg-card p-4 text-xs text-zinc-500">
              <p className="font-medium text-zinc-400 mb-2">Score Guide</p>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-perf-green" /> 90-100: Good -- your site is fast
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-perf-yellow" /> 50-89: Needs Improvement -- users may notice delays
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-perf-red" /> 0-49: Poor -- users are likely leaving due to slow speed
                </span>
              </div>
              <p className="mt-2">
                Powered by Lighthouse (running locally). Results may vary between runs.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !results && !error && (
          <div className="mt-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Search className="text-accent" size={28} />
            </div>
            <h2 className="text-xl font-semibold">Analyze Any Website</h2>
            <p className="text-zinc-500 mt-2 max-w-md mx-auto text-sm">
              Enter a URL to get detailed performance scores for both mobile and desktop,
              with plain-language explanations and actionable tips to improve speed.
            </p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Smartphone size={12} /> Mobile analysis
              </span>
              <span>+</span>
              <span className="flex items-center gap-1.5">
                <Monitor size={12} /> Desktop analysis
              </span>
              <span>=</span>
              <span>Complete picture</span>
            </div>
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
