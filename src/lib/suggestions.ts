import { AuditItem, DiagnosticItem } from "./types";

const AUDIT_SUGGESTIONS: Record<string, { cause: string; solution: string; metric: string }> = {
  "render-blocking-resources": {
    cause: "CSS and JS files in <head> block the browser from rendering content until they're fully downloaded and parsed.",
    solution: "Defer non-critical CSS/JS with async/defer attributes. Inline critical CSS. Use dynamic imports in Next.js for heavy components.",
    metric: "FCP / LCP",
  },
  "unused-css-rules": {
    cause: "Large CSS files contain rules that don't apply to the current page, wasting bandwidth and parse time.",
    solution: "Use PurgeCSS or Tailwind's built-in purging. Split CSS per route. Audit with Chrome DevTools Coverage tab.",
    metric: "FCP",
  },
  "unused-javascript": {
    cause: "JavaScript bundles include code that's never executed on this page, increasing download and parse time.",
    solution: "Use Next.js dynamic imports: `dynamic(() => import('./HeavyComponent'))`. Tree-shake unused exports. Split vendor chunks.",
    metric: "TBT",
  },
  "unminified-css": {
    cause: "CSS files are served without minification, making them larger than necessary.",
    solution: "Ensure your build process minifies CSS. Next.js does this automatically in production builds.",
    metric: "FCP",
  },
  "unminified-javascript": {
    cause: "JavaScript files are served without minification.",
    solution: "Ensure you're running `next build` for production. Check that no unminified vendor scripts are loaded.",
    metric: "TBT",
  },
  "efficient-animated-content": {
    cause: "Large GIFs or unoptimized video content consumes bandwidth and CPU.",
    solution: "Replace GIFs with <video> elements using MP4/WebM. Use `next/image` for animated content when possible.",
    metric: "LCP",
  },
  "offscreen-images": {
    cause: "Images below the fold are loaded eagerly, competing with critical resources.",
    solution: "Use `loading='lazy'` on offscreen images. Next.js `<Image>` component handles this automatically.",
    metric: "LCP",
  },
  "uses-responsive-images": {
    cause: "Images are served at a resolution larger than what the viewport needs.",
    solution: "Use `next/image` with proper `sizes` attribute. Serve WebP/AVIF formats. Use srcset for different breakpoints.",
    metric: "LCP",
  },
  "uses-optimized-images": {
    cause: "Images aren't compressed or are in inefficient formats (PNG/JPEG instead of WebP/AVIF).",
    solution: "Use `next/image` which auto-optimizes. Convert to WebP/AVIF. Compress with tools like Squoosh or Sharp.",
    metric: "LCP",
  },
  "modern-image-formats": {
    cause: "Images use legacy formats (JPEG/PNG) instead of modern compressed formats.",
    solution: "Use WebP or AVIF. Next.js Image component can serve WebP automatically via `formats: ['image/webp']` in next.config.",
    metric: "LCP",
  },
  "uses-text-compression": {
    cause: "Server doesn't compress text-based responses (HTML, CSS, JS) with gzip/brotli.",
    solution: "Enable gzip/brotli on your server or CDN. Vercel/Netlify do this automatically. For custom servers, add compression middleware.",
    metric: "FCP / LCP",
  },
  "uses-long-cache-ttl": {
    cause: "Static assets don't have proper cache headers, forcing re-downloads on repeat visits.",
    solution: "Set `Cache-Control: max-age=31536000, immutable` for hashed assets. Next.js handles this for _next/static/ files.",
    metric: "All metrics (repeat visits)",
  },
  "dom-size": {
    cause: "Excessively large DOM (>1500 elements) slows layout calculations and increases memory usage.",
    solution: "Virtualize long lists (react-window/react-virtualized). Lazy-load offscreen sections. Simplify nested layouts.",
    metric: "TBT / CLS",
  },
  "total-byte-weight": {
    cause: "Total page weight is too large, causing slow loads especially on mobile networks.",
    solution: "Audit bundle with `@next/bundle-analyzer`. Code-split aggressively. Compress images. Remove unused dependencies.",
    metric: "All metrics",
  },
  "mainthread-work-breakdown": {
    cause: "Too much work on the main thread (script evaluation, style/layout, etc.) blocks interactivity.",
    solution: "Reduce JS execution time. Use Web Workers for heavy computation. Defer non-critical scripts. Optimize React re-renders.",
    metric: "TBT",
  },
  "bootup-time": {
    cause: "JavaScript takes too long to parse, compile, and execute.",
    solution: "Reduce JS bundle size. Use code splitting. Defer third-party scripts. Consider using `next/script` with strategy='lazyOnload'.",
    metric: "TBT",
  },
  "font-display": {
    cause: "Custom fonts block text rendering until they're fully loaded.",
    solution: "Use `font-display: swap` in @font-face. Next.js `next/font` handles this automatically with optimal loading.",
    metric: "FCP / CLS",
  },
  "third-party-summary": {
    cause: "Third-party scripts (analytics, ads, chat widgets) add significant load time and block the main thread.",
    solution: "Audit third-party impact. Load non-critical scripts with `next/script strategy='lazyOnload'`. Use Partytown for web workers.",
    metric: "TBT",
  },
  "largest-contentful-paint-element": {
    cause: "The largest visible element (usually a hero image or heading) takes too long to render.",
    solution: "Preload the LCP image with `priority` prop in next/image. Inline critical CSS. Reduce server response time (TTFB).",
    metric: "LCP",
  },
  "layout-shifts": {
    cause: "Elements shift position during page load, causing visual instability.",
    solution: "Set explicit width/height on images/videos. Use CSS aspect-ratio. Reserve space for dynamic content. Avoid inserting content above existing content.",
    metric: "CLS",
  },
  "long-tasks": {
    cause: "JavaScript tasks running >50ms block the main thread, making the page feel unresponsive.",
    solution: "Break long tasks with `requestIdleCallback` or `setTimeout`. Use React.memo/useMemo to prevent unnecessary re-renders. Move work to Web Workers.",
    metric: "TBT",
  },
  "server-response-time": {
    cause: "Slow server response time (TTFB) delays everything that follows.",
    solution: "Use CDN. Enable caching (ISR/SSG in Next.js). Optimize database queries. Use edge functions for dynamic content.",
    metric: "FCP / LCP",
  },
  "redirects": {
    cause: "HTTP redirects add extra round-trips before the page can start loading.",
    solution: "Eliminate unnecessary redirects. Use Next.js `redirects` in next.config.js for server-side redirects instead of client-side.",
    metric: "FCP",
  },
  "uses-rel-preconnect": {
    cause: "Connections to third-party origins aren't established early, adding latency.",
    solution: "Add `<link rel='preconnect' href='https://domain.com'>` for critical third-party origins in your `<Head>`.",
    metric: "FCP / LCP",
  },
  "critical-request-chains": {
    cause: "Resources form dependency chains that must load sequentially, blocking rendering.",
    solution: "Preload critical resources. Inline critical CSS. Use `<link rel='preload'>` for fonts and key images.",
    metric: "FCP / LCP",
  },
  "duplicated-javascript": {
    cause: "Same JavaScript modules are included in multiple bundles.",
    solution: "Check for duplicate packages in node_modules. Use `@next/bundle-analyzer` to visualize. Dedupe with npm dedupe.",
    metric: "TBT",
  },
  "legacy-javascript": {
    cause: "Modern JavaScript is transpiled to legacy syntax unnecessarily, increasing bundle size.",
    solution: "Set appropriate browserslist targets. Next.js serves modern JS to modern browsers via differential loading.",
    metric: "TBT",
  },
  "viewport": {
    cause: "Page doesn't have a proper viewport meta tag, causing rendering issues on mobile.",
    solution: "Next.js adds this automatically. If missing, add `<meta name='viewport' content='width=device-width, initial-scale=1'>` to your layout.",
    metric: "Mobile usability",
  },
};

export function generateDiagnostics(opportunities: AuditItem[]): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];

  for (const audit of opportunities) {
    const suggestion = AUDIT_SUGGESTIONS[audit.id];
    if (suggestion) {
      diagnostics.push({
        title: audit.title,
        cause: suggestion.cause,
        solution: suggestion.solution,
        impact: audit.score === null ? "medium" : audit.score < 0.5 ? "high" : audit.score < 0.9 ? "medium" : "low",
        metric: suggestion.metric,
        savings: audit.displayValue,
      });
    } else {
      diagnostics.push({
        title: audit.title,
        cause: audit.description,
        solution: "Review this audit in Chrome DevTools Lighthouse panel for specific recommendations.",
        impact: audit.score === null ? "medium" : audit.score < 0.5 ? "high" : audit.score < 0.9 ? "medium" : "low",
        metric: "General",
        savings: audit.displayValue,
      });
    }
  }

  diagnostics.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  });

  return diagnostics;
}
