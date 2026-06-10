# ⚖️ Speed Doctor vs. Google PageSpeed Insights: Comparison & Alignment Guide

This guide explains how **Speed Doctor** compares to **Google PageSpeed Insights (PSI)**, why their performance scores and metrics differ, and how to choose the right tool for your auditing workflow.

As an open-source project, transparency is our core principle. Speed Doctor is built to solve a specific problem: **translating technical metric diagnostics into actionable human and developer steps.** Below is the breakdown of how we fit into the web optimization ecosystem.

---

## 📊 Side-by-Side Comparison

| Feature / Criteria | 🩺 Speed Doctor | ⚡ Google PageSpeed Insights |
| :--- | :--- | :--- |
| **Primary Audience** | **Non-technical owners** (Plain English explanations) & **Developers** (ready-to-use code fixes). | Search Engine Optimization (SEO) professionals, compliance officers, and advanced performance engineers. |
| **Telemetry Type** | **Lab Data** (On-demand synthetic browser run using Chromium). | **Field Data** (Real-world user CrUX logs) + **Lab Data** (On-demand run). |
| **Measurement Engine** | Programmatic Chrome & Lighthouse Core. | Google-hosted Chrome User Experience database + cloud Lighthouse. |
| **Actionable Fixes** | **High**: Generates actual CSS, JS, or HTML code blocks matching your selectors. | **Medium**: Highlights issues (e.g., "reduce unused CSS") but does not write code fixes. |
| **Terminology** | Translated to plain language (e.g., "The main image took too long to load" instead of "Largest Contentful Paint"). | Standardized technical jargon (TBT, LCP, CLS, INP, FCP, TTFB). |
| **Test Location** | Originates from your deployed Worker server location. | Originates from Google's regional data center nearest to the target server. |
| **Historical Logs** | Open-source data structures stored in your own PostgreSQL instance. | Free API search limited to global aggregate trends. |
| **Custom Rules** | **Yes**: Rule engine accepts ESLint-style community rules (WordPress, Shopify, Next.js). | **No**: Strict built-in Lighthouse ruleset. |

---

## ⚙️ Why the Measurement Metrics Differ (The Science)

Even though Speed Doctor runs Google's official Lighthouse engine under the hood, the final numbers will rarely match PageSpeed Insights. Here is why:

### 1. The Virtual Machine Baseline (CPU/RAM Throttling)
*   **Google PSI:** Runs on standardized, isolated cloud container nodes inside Google Cloud Platform. Google applies a strict throttling factor (e.g., emulating a 4x CPU slowdown) to represent a generic mobile phone.
*   **Speed Doctor:** Runs on your specific worker hosting server (or local machine during development). A faster, unthrottled server processor compiles JavaScript faster, significantly lowering **Total Blocking Time (TBT)** and improving the **Performance Score**.

### 2. Geographic Latency
*   **Google PSI:** Routes audits dynamically through the closest Google Edge center relative to the target website.
*   **Speed Doctor:** Audits originate entirely from the single region where your worker application is hosted. If your worker is in US-East and the target site is hosted in Europe, metric results like **Time to First Byte (TTFB)** and **Largest Contentful Paint (LCP)** will naturally be higher.

### 3. Lab Data vs. 28-Day Field Data
*   **Google PSI** scores are heavily influenced by **Chrome User Experience (CrUX)** records—historical data collected from millions of real Chrome browsers over a rolling 28-day window.
*   **Speed Doctor** has no access to real user history. It reflects a **single moment in time** using an automated browser. Features like **Interaction to Next Paint (INP)** require real human clicks/scrolls, meaning Speed Doctor can only estimate these using browser event indicators.

---

## 🎯 Which Tool is Best for Whom?

### 🩺 Speed Doctor is best for:
1.  **Non-Technical Website Owners & Marketers:**
    *   *Why:* PSI reports can be intimidating. Speed Doctor translates phrases like *"Avoid enormous network payloads"* into *"Your homepage image is 4MB; you need to compress it so it loads faster."*
2.  **Agencies & Freelancers Pitching Clients:**
    *   *Why:* Provides clear, simplified summaries that are easy to present to non-technical clients to explain why their site needs optimization.
3.  **Active Developers Looking for Fast Solutions:**
    *   *Why:* Unlike PageSpeed, which only points out *what* is wrong, Speed Doctor generates actual **code fixes** (e.g., exact CSS adjustments, responsive image source tags) that you can copy and paste directly into your project.

### ⚡ Google PageSpeed Insights is best for:
1.  **SEO Compliance & Search Ranking Audits:**
    *   *Why:* Google uses its own PageSpeed database (CrUX) to calculate **Core Web Vitals** scores for search ranking algorithm adjustments. To see what Google's ranking bot sees, you *must* reference the official PSI score.
2.  **Enterprise SLAs & Hardware-Neutral Auditing:**
    *   *Why:* PSI guarantees a completely sterile, standardized computing environment, making it the industry standard for formal performance compliance contracts.

---

## ⚠️ Known Open-Source Limitations

When hosting your own instance of Speed Doctor, keep these variables in mind:
*   **Server Stability:** If your worker server is running at 100% CPU capacity due to a sudden traffic spike, the active browser scan will run slower. This will artificially lower the score of whichever website is being audited at that moment.
*   **IP Blocks / Captchas:** Headless automation can sometimes be blocked by services like Cloudflare or Akamai on the target website. Google PSI is whitelisted by most major CDNs; your open-source worker IP might not be.
