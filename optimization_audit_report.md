# Maven Trading Journal - Complete Website Optimization & Audit Report

This report provides the full detailed audit across Performance, SEO, Accessibility, Mobile, Security, Code Quality, Conversion Rate Optimization (CRO), and Infrastructure, following the Master Website Optimization Prompt guidelines.

---

## 1. PERFORMANCE AUDIT

### Prioritized Changes

| Priority | Component & Current Issue | Recommended Fix | Expected Lighthouse Impact |
| :--- | :--- | :--- | :--- |
| **High** | **LCP Hero Layout Hydration Lag**<br>Sidebar status and layout state hydrate client-side, causing layout shift and rendering delays on the main dashboard cards above the fold. | Render static layout shell outline via server-side props first, and apply deferred client-side logic to sidebar collapse options using `requestIdleCallback` to reduce main thread blocking. | **+15 to Performance Score**<br>(LCP < 2.0s) |
| **High** | **Render Blocking Chart Widgets**<br>TradingView widget frame scripts block page load in `layout.tsx` headers. | Add `async` and `defer` attributes to third-party widget script loaders. Lazy-load non-essential charts using dynamic Next.js components. | **+12 to Performance Score**<br>(TBT reduced by 400ms) |
| **Medium** | **Layout Shift (CLS) on Dynamic Components**<br>Recharts equity and session charts do not have rigid aspect-ratio skeleton wrappers, shifting content down during loading. | Apply explicit width/height parameters or wrap in styled aspect-ratio containers (`aspect-[2/1]`) to reserve space during async fetching. | **+8 to Performance Score**<br>(CLS < 0.05) |
| **Medium** | **Asset Size and Compression**<br>Static assets and screenshots are served in raw formats. | Enforce WebP/AVIF formats in `next.config.ts` and set up edge compression (Brotli/Gzip fallbacks). | **+5 to Performance Score**<br>(Weight < 1.2MB) |

---

## 2. SEO AUDIT & STRATEGY

### Priority Checklist

#### High Impact
* **Title & Description Lengths**: Ensure page headers match constraints.
  * *Example*: In `trades/[id]/page.tsx`, set the tab title dynamically to `Trade TRD-XXX | Maven Trading Journal` (45 chars) and description to under 150 chars.
* **Canonical URL Mapping**: Enforce canonical definitions across pages.
  * *Example*: Add `<link rel="canonical" href="https://journal.maven.com/trades" />` in layout templates.

#### Medium Impact
* **Structured JSON-LD Data**:
  * *Example*: Add `FAQPage` structured data to lessons and psychology databases or `WebSite` schemas.
* **Open Graph / Twitter Cards**: Define standard rich preview tags.
  * *Example*: Open Graph tags in `layout.tsx` pointing to official logo image assets.

#### Low Impact
* **Header Hierarchy**: Fix skipped header tags (e.g. going from `H1` to `H3` directly in dashboard cards). Use nested elements correctly.

---

## 3. ACCESSIBILITY (WCAG 2.2 AA Compliance)

### WCAG Criterion Findings

#### Critical Severity
* **WCAG 2.1.1 (Keyboard Navigation - Focus Trapping)**:
  * *Issue*: OnboardingWizard and QuickEntryModal modals did not fully trap tab key navigation, allowing focus to escape to the underlying page shell.
  * *Code Fix*:
    ```typescript
    // Trapped focus logic inside modal
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstEl) {
        lastEl.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        firstEl.focus(); e.preventDefault();
      }
    }
    ```

#### Major Severity
* **WCAG 2.4.7 (Focus Visible)**:
  * *Issue*: Missing highly visible outlines on links and buttons in custom toggle grids.
  * *Code Fix*: Added generic `*:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` rules in `globals.css`.
* **WCAG 3.3.2 (Labels or Instructions)**:
  * *Issue*: Form inputs in settings page lacked accessible labels.
  * *Code Fix*: Linked every `<input>` with corresponding `id` matched by `<label htmlFor="id">`.

---

## 4. MOBILE-FIRST AUDIT

### Breakpoint Recommendations
- Use Tailwind's default layout breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
- base styles must target viewports <= 640px (mobile-first approach).

### Mobile Performance Budget
- **First Contentful Paint (FCP)**: < 1.5s
- **Total JS Payload**: < 200KB (gzip-compressed)
- **Minimum Tap Target**: 44×44px (e.g. heatmap cells padding expanded to 44px on coarse pointers).
- **Font Size**: Enforce `16px` on inputs to prevent automatic layout zooming on iOS.

---

## 5. SECURITY AUDIT

### Severity-Ranked Vulnerabilities

| Severity | Issue | Recommended Fix | Code Example |
| :--- | :--- | :--- | :--- |
| **High** | **Content Security Policy (CSP)**<br>Lack of script execution boundaries. | Add a CSP header to next.config.ts. | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://s3.tradingview.com;` |
| **High** | **API Route Ingestion Abuse**<br>Missing rate limits on webhook and trade creation endpoints. | Add client sliding-window IP limits. | `const { allowed } = rateLimit(ip, { maxRequests: 20 });` |
| **Medium** | **Input Sanitization**<br>Direct client inputs mapped to database without schema checking. | Use Zod parser schema validation. | `const result = TradeInputSchema.safeParse(bodyRaw);` |

---

## 6. CODE QUALITY & ARCHITECTURE

### Refactoring Recommendations

#### Calculations Component (Before / After)

*Before (Vulnerable to NaNs and Zero-division)*:
```typescript
export function calculateRR(entryPrice, stopLoss, takeProfit) {
  const risk = Math.abs(entryPrice - stopLoss);
  return Math.abs(takeProfit - entryPrice) / risk;
}
```

*After (Safe with check guards)*:
```typescript
export function calculateRR(entryPrice: number, stopLoss: number, takeProfit: number): number {
  if (isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit)) return 0;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  return Math.abs(takeProfit - entryPrice) / risk;
}
```

---

## 7. CONVERSION RATE OPTIMIZATION (CRO)

### A/B Test Hypotheses

1. **Hypothesis: Action-Oriented CTAs**
   - *Change*: Change button label from "Submit" to "Save Trade & Analyze 🚀".
   - *Impact × Effort*: High Impact / Low Effort.
2. **Hypothesis: Multi-Step Form Reduction**
   - *Change*: Group checklist items into 2-step modular tabs instead of presenting 11 rows concurrently.
   - *Impact × Effort*: Medium Impact / Medium Effort.

---

## 8. INFRASTRUCTURE & OBSERVABILITY

### Priority Tiers

#### Immediate
- Configure `gzip/Brotli` compression filters on next.js standalone servers.
- Automate lint and TypeScript checks during the CI/CD pull request pipeline.

#### Next Sprint
- Set up automated accessibility checks (e.g. `axe-core`) on staging.
- Implement short-lived caching strategies (`Cache-Control: public, s-maxage=60`) on dashboard API requests.

#### Long-Term
- Implement edge middleware routing for local user sessions.
