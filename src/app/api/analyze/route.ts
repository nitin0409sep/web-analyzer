import { NextRequest, NextResponse } from "next/server";
import { AnalysisResult, PerformanceMetric, AuditItem } from "@/lib/types";
import { generateDiagnostics } from "@/lib/suggestions";

const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

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

export async function POST(request: NextRequest) {
  try {
    const { url, strategy = "mobile" } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let targetUrl = url;
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Check if localhost - PSI can't analyze localhost
    const urlObj = new URL(targetUrl);
    if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
      return NextResponse.json(
        { error: "PageSpeed Insights cannot analyze localhost URLs. Deploy your app or use a tunneling service like ngrok to get a public URL." },
        { status: 400 }
      );
    }

    const apiUrl = `${PSI_API}?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as Record<string, Record<string, string>>)?.error?.message || "Failed to analyze URL";
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    const lighthouseResult = data.lighthouseResult;

    if (!lighthouseResult) {
      return NextResponse.json({ error: "No Lighthouse data returned" }, { status: 500 });
    }

    const metrics = extractMetrics(lighthouseResult);
    const opportunities = extractAudits(lighthouseResult, "opportunities");
    const passedAudits = extractAudits(lighthouseResult, "passed");
    const diagnostics = generateDiagnostics(opportunities);
    const resourceSummary = extractResourceSummary(lighthouseResult);

    const categories = lighthouseResult.categories as Record<string, Record<string, unknown>>;
    const overallScore = Math.round(((categories.performance.score as number) || 0) * 100);

    // Extract screenshot
    const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
    const screenshotAudit = audits["final-screenshot"];
    const screenshot = screenshotAudit?.details
      ? ((screenshotAudit.details as Record<string, unknown>).data as string) || null
      : null;

    const result: AnalysisResult = {
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
