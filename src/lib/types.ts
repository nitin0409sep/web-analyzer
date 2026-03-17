export interface PerformanceMetric {
  id: string;
  title: string;
  abbreviation: string;
  value: number | null;
  displayValue: string;
  score: number | null; // 0-1
  description: string;
}

export interface AuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  details?: {
    type: string;
    items?: Array<Record<string, unknown>>;
    headings?: Array<{ key: string; label: string }>;
  };
  numericValue?: number;
}

export interface DiagnosticItem {
  title: string;
  cause: string;
  solution: string;
  impact: "high" | "medium" | "low";
  metric: string;
  savings?: string;
}

export interface AnalysisResult {
  url: string;
  fetchTime: string;
  overallScore: number;
  metrics: PerformanceMetric[];
  diagnostics: DiagnosticItem[];
  opportunities: AuditItem[];
  passedAudits: AuditItem[];
  resourceSummary: {
    totalSize: number;
    totalRequests: number;
    breakdown: Record<string, { size: number; count: number }>;
  } | null;
  screenshot: string | null;
}

export interface DualAnalysisResult {
  mobile: AnalysisResult;
  desktop: AnalysisResult;
}
