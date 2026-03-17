export interface MetricExplanation {
  plain: string;
  good: string;
  needsWork: string;
  poor: string;
  tip: string;
}

const explanations: Record<string, MetricExplanation> = {
  "first-contentful-paint": {
    plain: "How long until visitors see the first piece of content (text or image) on your page.",
    good: "Under 1.8 seconds",
    needsWork: "1.8 - 3.0 seconds",
    poor: "Over 3.0 seconds",
    tip: "Think of it like waiting for a store's sign to light up -- visitors want to know the page is loading.",
  },
  "largest-contentful-paint": {
    plain: "How long until the biggest visible element (usually a hero image or main heading) fully loads.",
    good: "Under 2.5 seconds",
    needsWork: "2.5 - 4.0 seconds",
    poor: "Over 4.0 seconds",
    tip: "This is the moment your visitor thinks \"the page is ready.\" It's the most important speed metric for user experience.",
  },
  "total-blocking-time": {
    plain: "How long the page was frozen and couldn't respond to clicks or typing.",
    good: "Under 200 milliseconds",
    needsWork: "200 - 600 milliseconds",
    poor: "Over 600 milliseconds",
    tip: "Imagine clicking a button and nothing happens -- that's what blocking time feels like to your visitors.",
  },
  "cumulative-layout-shift": {
    plain: "How much things jump around on the page while it loads (buttons shifting, text moving, etc.).",
    good: "Under 0.1",
    needsWork: "0.1 - 0.25",
    poor: "Over 0.25",
    tip: "Ever tried to click a button and the page shifted so you clicked something else? That's layout shift. Lower is better.",
  },
  "speed-index": {
    plain: "How quickly the visible area of the page fills in with content.",
    good: "Under 3.4 seconds",
    needsWork: "3.4 - 5.8 seconds",
    poor: "Over 5.8 seconds",
    tip: "A page that loads content gradually feels slower than one that shows everything at once, even if both finish at the same time.",
  },
  interactive: {
    plain: "How long until the page is fully usable -- you can click buttons, scroll, and type without lag.",
    good: "Under 3.8 seconds",
    needsWork: "3.8 - 7.3 seconds",
    poor: "Over 7.3 seconds",
    tip: "A page might look ready but still be frozen. TTI tells you when it's truly ready to use.",
  },
};

export function getMetricExplanation(metricId: string): MetricExplanation | null {
  return explanations[metricId] || null;
}
