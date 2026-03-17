import { NextRequest, NextResponse } from "next/server";
import { AnalysisResult, PerformanceMetric, AuditItem } from "@/lib/types";
import { generateDiagnostics } from "@/lib/suggestions";

// Allow up to 3 minutes for dual Lighthouse runs
export const maxDuration = 180;

const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const PSI_API_KEY = process.env.GOOGLE_PSI_API_KEY || "";
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY;

// In-memory cache (URL+strategy -> result, 30 min TTL)
const cache = new Map<string, { data: AnalysisResult; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000;

function extractMetrics(lighthouseResult: Record<string, unknown>): PerformanceMetric[] {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;

  const metricDefs = [
    { id: "first-contentful-paint", title: "First Contentful Paint", abbreviation: "FCP", description: "Time until the first text or image is painted on screen." },
    { id: "largest-contentful-paint", title: "Largest Contentful Paint", abbreviation: "LCP", description: "Time until the largest content element becomes visible." },
    { id: "total-blocking-time", title: "Total Blocking Time", abbreviation: "TBT", description: "Total time where the main thread was blocked long enough to prevent input responsiveness." },
    { id: "cumulative-layout-shift", title: "Cumulative Layout Shift", abbreviation: "CLS", description: "Measures visual stability - how much the page layout shifts during loading." },
    { id: "speed-index", title: "Speed Index", abbreviation: "SI", description: "How quickly the contents of a page are visibly populated." },
    { id: "interactive", title: "Time to Interactive", abbreviation: "TTI", description: "Time until the page is fully interactive and responds to user input." },
  ];

  return metricDefs.map((def) => {
    const audit = audits[def.id];
    return {
      id: def.id,
      title: def.title,
      abbreviation: def.abbreviation,
      value: (audit?.numericValue as number) ?? null,
      displayValue: (audit?.displayValue as string) ?? "N/A",
      score: (audit?.score as number) ?? null,
      description: def.description,
    };
  });
}

function extractAudits(lighthouseResult: Record<string, unknown>, type: "opportunities" | "passed"): AuditItem[] {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const categories = lighthouseResult.categories as Record<string, Record<string, unknown>>;
  const perfCategory = categories.performance;
  const auditRefs = (perfCategory.auditRefs as Array<Record<string, unknown>>) || [];

  const items: AuditItem[] = [];

  for (const ref of auditRefs) {
    const auditId = ref.id as string;
    const audit = audits[auditId];
    if (!audit) continue;

    const score = audit.score as number | null;
    const group = ref.group as string | undefined;

    if (type === "opportunities") {
      if (score !== null && score < 0.9 && (group === "load-opportunities" || group === "diagnostics")) {
        items.push({
          id: auditId,
          title: audit.title as string,
          description: audit.description as string,
          score,
          displayValue: audit.displayValue as string | undefined,
          numericValue: audit.numericValue as number | undefined,
        });
      }
    } else {
      if (score === 1 && (group === "load-opportunities" || group === "diagnostics")) {
        items.push({
          id: auditId,
          title: audit.title as string,
          description: audit.description as string,
          score,
        });
      }
    }
  }

  items.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  return items;
}

function extractResourceSummary(lighthouseResult: Record<string, unknown>) {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const resourceSummary = audits["resource-summary"];

  if (!resourceSummary?.details) return null;

  const details = resourceSummary.details as Record<string, unknown>;
  const items = (details.items as Array<Record<string, unknown>>) || [];

  let totalSize = 0;
  let totalRequests = 0;
  const breakdown: Record<string, { size: number; count: number }> = {};

  for (const item of items) {
    const resourceType = item.resourceType as string;
    const transferSize = (item.transferSize as number) || 0;
    const requestCount = (item.requestCount as number) || 0;

    if (resourceType === "total") {
      totalSize = transferSize;
      totalRequests = requestCount;
    } else {
      breakdown[resourceType] = {
        size: transferSize,
        count: requestCount,
      };
    }
  }

  return { totalSize, totalRequests, breakdown };
}

async function runWithPSI(targetUrl: string, strategy: string, withKey = true): Promise<Record<string, unknown>> {
  let apiUrl = `${PSI_API}?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;
  if (withKey && PSI_API_KEY) {
    apiUrl += `&key=${encodeURIComponent(PSI_API_KEY)}`;
  }

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorObj = (errorData as Record<string, Record<string, unknown>>)?.error;
    const errorMessage = (errorObj?.message as string) || "Failed to analyze URL";

    // If API key is invalid, retry without it
    if (withKey && PSI_API_KEY && (response.status === 400 || response.status === 403) && errorMessage.toLowerCase().includes("api key")) {
      console.log("PSI API key invalid, retrying without key");
      return runWithPSI(targetUrl, strategy, false);
    }

    if (response.status === 429 || errorMessage.toLowerCase().includes("quota")) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data.lighthouseResult) {
    throw new Error("No Lighthouse data returned");
  }
  return data.lighthouseResult as Record<string, unknown>;
}

async function runWithLocalLighthouse(targetUrl: string, strategy: string): Promise<Record<string, unknown>> {
  const lighthouse = (await import("lighthouse")).default;
  const chromeLauncher = await import("chrome-launcher");

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });

  try {
    const runnerResult = await lighthouse(targetUrl, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance"],
      formFactor: strategy === "desktop" ? "desktop" : "mobile",
      screenEmulation: strategy === "desktop"
        ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
        : undefined,
      throttling: strategy === "desktop"
        ? { cpuSlowdownMultiplier: 1, downloadThroughputKbps: 0, uploadThroughputKbps: 0, requestLatencyMs: 0, rttMs: 40, throughputKbps: 10240 }
        : undefined,
    });

    if (!runnerResult?.lhr) {
      throw new Error("Lighthouse returned no results");
    }
    return runnerResult.lhr as unknown as Record<string, unknown>;
  } finally {
    await chrome.kill();
  }
}

async function getLighthouseResult(targetUrl: string, strategy: string): Promise<Record<string, unknown>> {
  if (isServerless) {
    return runWithPSI(targetUrl, strategy);
  }
  try {
    return await runWithLocalLighthouse(targetUrl, strategy);
  } catch {
    console.log("Local Lighthouse failed, falling back to PSI API");
    return runWithPSI(targetUrl, strategy);
  }
}

function buildAnalysisResult(targetUrl: string, lighthouseResult: Record<string, unknown>): AnalysisResult {
  const metrics = extractMetrics(lighthouseResult);
  const opportunities = extractAudits(lighthouseResult, "opportunities");
  const passedAudits = extractAudits(lighthouseResult, "passed");
  const diagnostics = generateDiagnostics(opportunities);
  const resourceSummary = extractResourceSummary(lighthouseResult);

  const categories = lighthouseResult.categories as Record<string, Record<string, unknown>>;
  const overallScore = Math.round(((categories.performance.score as number) || 0) * 100);

  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const screenshotAudit = audits["final-screenshot"];
  const screenshot = screenshotAudit?.details
    ? ((screenshotAudit.details as Record<string, unknown>).data as string) || null
    : null;

  return {
    url: targetUrl,
    fetchTime: new Date().toISOString(),
    overallScore,
    metrics,
    diagnostics,
    opportunities,
    passedAudits,
    resourceSummary,
    screenshot,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url, strategy = "both" } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Validate URL format
    new URL(targetUrl);

    // Dual analysis mode
    if (strategy === "both") {
      const mobileCacheKey = `${targetUrl}:mobile`;
      const desktopCacheKey = `${targetUrl}:desktop`;
      const cachedMobile = cache.get(mobileCacheKey);
      const cachedDesktop = cache.get(desktopCacheKey);

      const now = Date.now();
      const hasCachedMobile = cachedMobile && cachedMobile.expiry > now;
      const hasCachedDesktop = cachedDesktop && cachedDesktop.expiry > now;

      let mobileResult: AnalysisResult;
      let desktopResult: AnalysisResult;

      if (hasCachedMobile && hasCachedDesktop) {
        mobileResult = cachedMobile.data;
        desktopResult = cachedDesktop.data;
      } else if (isServerless) {
        // Run in parallel on serverless (PSI API)
        const [mobileLH, desktopLH] = await Promise.all([
          hasCachedMobile ? Promise.resolve(null) : getLighthouseResult(targetUrl, "mobile"),
          hasCachedDesktop ? Promise.resolve(null) : getLighthouseResult(targetUrl, "desktop"),
        ]);
        mobileResult = hasCachedMobile ? cachedMobile.data : buildAnalysisResult(targetUrl, mobileLH!);
        desktopResult = hasCachedDesktop ? cachedDesktop.data : buildAnalysisResult(targetUrl, desktopLH!);
      } else {
        // Run sequentially locally to avoid resource contention
        if (hasCachedMobile) {
          mobileResult = cachedMobile.data;
        } else {
          const mobileLH = await getLighthouseResult(targetUrl, "mobile");
          mobileResult = buildAnalysisResult(targetUrl, mobileLH);
        }
        if (hasCachedDesktop) {
          desktopResult = cachedDesktop.data;
        } else {
          const desktopLH = await getLighthouseResult(targetUrl, "desktop");
          desktopResult = buildAnalysisResult(targetUrl, desktopLH);
        }
      }

      // Cache individual results
      if (!hasCachedMobile) {
        cache.set(mobileCacheKey, { data: mobileResult, expiry: now + CACHE_TTL });
      }
      if (!hasCachedDesktop) {
        cache.set(desktopCacheKey, { data: desktopResult, expiry: now + CACHE_TTL });
      }

      return NextResponse.json({ mobile: mobileResult, desktop: desktopResult });
    }

    // Single strategy mode
    const cacheKey = `${targetUrl}:${strategy}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const lighthouseResult = await getLighthouseResult(targetUrl, strategy);
    const result = buildAnalysisResult(targetUrl, lighthouseResult);
    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
