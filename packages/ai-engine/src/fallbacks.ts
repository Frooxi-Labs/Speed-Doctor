import { type AIExplanation } from '@speed-doctor/shared-types';

export const LOCAL_FALLBACKS: Record<string, AIExplanation> = {
  'images/oversized': {
    human: {
      title: 'Oversized Images Detected',
      explanation: 'Some images on this page are extremely large and consume a lot of bandwidth, slowing down page loads, especially for mobile users.',
      businessImpact: 'Large images cause users with slower connections to experience lag or bounce before the page loads, leading to lost conversion opportunities.',
      fix: 'Compress images using modern compression techniques and tools. Ensure you serve appropriately sized images based on the user\'s screen size.',
    },
    developer: {
      title: 'Optimize Image Sizes',
      rootCause: 'Image assets are served at resolutions or qualities that exceed practical display needs, resulting in file sizes over 1MB.',
      technicalImpact: 'Increases payload size and blocks the Largest Contentful Paint (LCP) metric from completing early.',
      codeExample: '// HTML responsive images\n<img src="hero-large.jpg"\n     srcset="hero-small.jpg 480w, hero-medium.jpg 800w, hero-large.jpg 1200w"\n     sizes="(max-width: 600px) 480px, (max-width: 1000px) 800px, 1200px"\n     alt="Hero Image">',
      references: ['https://web.dev/serve-responsive-images/', 'https://web.dev/choose-the-right-image-format/'],
    },
  },
  'images/unoptimized-format': {
    human: {
      title: 'Use Next-Gen Image Formats',
      explanation: 'The page is using older image formats (like PNG or JPEG) for large assets. Modern formats like WebP or AVIF compress much better.',
      businessImpact: 'Slower visual load times decrease user engagement and search engine rankings.',
      fix: 'Convert existing JPEG/PNG images to WebP or AVIF. Update image tags to serve next-gen formats with fallbacks.',
    },
    developer: {
      title: 'Convert Images to WebP/AVIF',
      rootCause: 'Legacy formats like PNG/JPEG are used for photographic or complex imagery where AVIF or WebP would offer 30-50% savings.',
      technicalImpact: 'Increases transfer bytes and delays rendering.',
      codeExample: '<picture>\n  <source srcset="image.avif" type="image/avif">\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="Description">\n</picture>',
      references: ['https://web.dev/serve-images-webp/'],
    },
  },
  'images/no-lazy-load': {
    human: {
      title: 'Lazy Load Below-the-Fold Images',
      explanation: 'Images that are not immediately visible are being downloaded right away, wasting user data and slowing the initial load.',
      businessImpact: 'Wastes mobile data for users who may never scroll to the bottom of the page.',
      fix: 'Add the loading="lazy" attribute to all images that are not in the initial viewport.',
    },
    developer: {
      title: 'Add loading="lazy" to non-critical images',
      rootCause: 'Images lack the browser-native loading="lazy" attribute, causing the browser to download all assets eagerly.',
      technicalImpact: 'Increases network congestion during critical initial loading phases.',
      codeExample: '<img src="footer-banner.jpg" loading="lazy" alt="Footer Banner">',
      references: ['https://web.dev/browser-level-image-lazy-loading/'],
    },
  },
  'js/render-blocking': {
    human: {
      title: 'Eliminate Render-Blocking Scripts',
      explanation: 'External scripts loaded in the page head are blocking the browser from displaying the page content to the user.',
      businessImpact: 'Users stare at a blank white screen longer, increasing bounce rates.',
      fix: 'Add async or defer attributes to your external script tags, or move them to the bottom of the page.',
    },
    developer: {
      title: 'Defer or Async External Scripts',
      rootCause: 'Script tags in <head> block the DOM parser and HTML rendering engine until they are downloaded and executed.',
      technicalImpact: 'Directly impacts First Contentful Paint (FCP) and DOM Interactive timelines.',
      codeExample: '<!-- Non-blocking script loading -->\n<script src="analytics.js" async></script>\n<script src="app-logic.js" defer></script>',
      references: ['https://web.dev/render-blocking-resources/'],
    },
  },
  'js/oversized-bundle': {
    human: {
      title: 'Reduce Large JavaScript Bundles',
      explanation: 'The application loads large JavaScript files, which take time to download and require significant CPU work to process.',
      businessImpact: 'Page responses feel sluggish, and mobile devices experience lag and freezes when handling interactions.',
      fix: 'Split your JavaScript code into smaller chunks, lazy-load non-critical modules, and audit large dependencies.',
    },
    developer: {
      title: 'Implement Code Splitting and Tree Shaking',
      rootCause: 'Large monolithic JS bundles are loaded on initial load instead of being chunked or dynamically loaded.',
      technicalImpact: 'Increases execution thread blockages, directly affecting Total Blocking Time (TBT) and Interaction to Next Paint (INP).',
      codeExample: '// Dynamic import in React / JS\nconst HeavyComponent = React.lazy(() => import(\'./HeavyComponent\'));',
      references: ['https://web.dev/reduce-javascript-payloads-with-code-splitting/'],
    },
  },
  'js/too-many-scripts': {
    human: {
      title: 'Reduce JavaScript Requests',
      explanation: 'The page loads a large number of script files, creating network overhead and slowing down overall speed.',
      businessImpact: 'High network latency on cellular connections can cause delays, hurting conversions.',
      fix: 'Bundle scripts together, remove unused trackers, and load non-essential scripts only when needed.',
    },
    developer: {
      title: 'Consolidate Script Requests',
      rootCause: 'Dozens of small JS scripts are fetched individually, leading to network queueing bottlenecks.',
      technicalImpact: 'Causes HTTP network request queueing and delays page hydration.',
      codeExample: '// Consolidate files in webpack/vite\nmodule.exports = {\n  optimization: {\n    splitChunks: { chunks: \'all\' }\n  }\n};',
      references: ['https://web.dev/resource-prioritization-browser-hints/'],
    },
  },
  'videos/preload-bloat': {
    human: {
      title: 'Optimize Video Preloading',
      explanation: 'Videos are eagerly loading data in the background before the user even clicks play, wasting bandwidth.',
      businessImpact: 'Increases server egress costs and wastes user data, especially on mobile devices.',
      fix: 'Set preload="none" or preload="metadata" on video elements unless they are autoplaying heroes.',
    },
    developer: {
      title: 'Configure Video Preload Attribute',
      rootCause: 'Video tags lack a preload configuration or are explicitly set to preload="auto", downloading megabytes of data eagerly.',
      technicalImpact: 'Contributes to TTFB delays and blocks bandwith for other critical assets.',
      codeExample: '<video src="promo.mp4" preload="metadata" controls></video>',
      references: ['https://web.dev/video-preloading/'],
    },
  },
  'videos/too-many': {
    human: {
      title: 'Too Many Video Elements',
      explanation: 'The page includes a high number of video players, which drains device memory and slows down rendering.',
      businessImpact: 'Devices (especially older mobile models) may crash or freeze, creating a poor user experience.',
      fix: 'Replace heavy video players with static preview images, and load the video content only on click.',
    },
    developer: {
      title: 'Replace Players with Click-to-Play Placeholders',
      rootCause: 'Multiple native video players are rendered on initial page load, consuming substantial DOM resources and thread bandwidth.',
      technicalImpact: 'Increases DOM complexity and initial paint times.',
      codeExample: '<!-- Lazy load video player on user click -->\n<div class="video-placeholder" onclick="loadVideo(this)">\n  <img src="thumbnail.jpg" alt="Play Video">\n</div>',
      references: ['https://web.dev/lazy-loading-video/'],
    },
  },
  'videos/no-mute-autoplay': {
    human: {
      title: 'Autoplay Videos Must Be Muted',
      explanation: 'Videos are configured to autoplay with sound, which is blocked by modern browsers and ruins user experience.',
      businessImpact: 'Unsolicited sound annoys users and often causes them to immediately leave the site.',
      fix: 'Add the "muted" attribute to your video tags if they use "autoplay".',
    },
    developer: {
      title: 'Add muted Attribute to Autoplay Videos',
      rootCause: 'Video elements feature the autoplay attribute but lack the muted attribute, triggering browser playback blocks.',
      technicalImpact: 'Browser flags console errors and blocks the autoplay process.',
      codeExample: '<video src="bg-loop.mp4" autoplay muted loop playsinline></video>',
      references: ['https://developer.chrome.com/blog/autoplay/'],
    },
  },
  'fonts/oversized-font': {
    human: {
      title: 'Compress Large Web Fonts',
      explanation: 'Web font files loaded by this page are very large, delaying the time it takes for text to become visible or styled.',
      businessImpact: 'Users see unstyled text or blank text spaces, making the site feel unprofessional and slow.',
      fix: 'Subset your fonts to remove unused characters and compress them to WOFF2 format.',
    },
    developer: {
      title: 'Subset and Compress Web Fonts',
      rootCause: 'Font files contain thousands of unused characters (e.g. multi-language glyphs) and lack modern compression.',
      technicalImpact: 'Blocks rendering of text (FOIT) and impacts First Contentful Paint.',
      codeExample: '// CSS font display settings\n@font-face {\n  font-family: \'Custom\';\n  src: url(\'custom.woff2\') format(\'woff2\');\n  font-display: swap;\n}',
      references: ['https://web.dev/reduce-webfont-size/'],
    },
  },
  'fonts/unoptimized-format': {
    human: {
      title: 'Use WOFF2 Font Format',
      explanation: 'The website loads legacy font formats (like TTF or OTF) which are not optimized for the web.',
      businessImpact: 'Slower loading of textual content decreases SEO ranking and user satisfaction.',
      fix: 'Convert all web fonts to the highly optimized WOFF2 format.',
    },
    developer: {
      title: 'Use WOFF2 and Remove TTF/OTF',
      rootCause: 'Legacy TTF/OTF files are served directly instead of modern WOFF2, which has built-in compression.',
      technicalImpact: 'Increases font size payloads by up to 70%.',
      codeExample: '@font-face {\n  font-family: \'Open Sans\';\n  src: url(\'opensans.woff2\') format(\'woff2\');\n  font-weight: 400;\n}',
      references: ['https://web.dev/optimize-webfonts/'],
    },
  },
  'fonts/too-many-families': {
    human: {
      title: 'Limit Web Font Families',
      explanation: 'The site is loading too many different font families and weights, adding unnecessary downloads.',
      businessImpact: 'Inconsistent design and slower loading times dilute the brand and drive away users.',
      fix: 'Limit the site to 2-3 essential font families and weights.',
    },
    developer: {
      title: 'Consolidate Web Font Deliveries',
      rootCause: 'Too many separate font families, styles, and weights are loaded, inflating network requests.',
      technicalImpact: 'Increases the page weight and cumulative text paint layout shifts (FOUT).',
      codeExample: '<!-- Keep Google Font families combined in single request -->\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">',
      references: ['https://web.dev/optimize-webfonts/'],
    },
  },
  'third-party/heavy-third-party': {
    human: {
      title: 'Reduce Third-Party Script Impact',
      explanation: 'Third-party integrations (like trackers, chat widgets, or advertisements) represent a major part of the page size.',
      businessImpact: 'Third-party scripts slow down the page, costing you conversions for integrations that may not be active.',
      fix: 'Defer third-party scripts, load them lazily after user interaction, or use server-side tracking.',
    },
    developer: {
      title: 'Lazy Load and Defer Third-Party Embeds',
      rootCause: 'Third-party scripts execute eagerly on page load, monopolizing the browser\'s main thread.',
      technicalImpact: 'Directly degrades Total Blocking Time (TBT) and delays Time to Interactive (TTI).',
      codeExample: '<!-- Load non-essential widget only on interaction -->\n<script>\n  window.addEventListener(\'scroll\', () => {\n    // Load widget code here on first scroll\n  }, { once: true });\n</script>',
      references: ['https://web.dev/efficiently-load-third-party-javascript/'],
    },
  },
  'third-party/too-many-trackers': {
    human: {
      title: 'Consolidate Analytics and Trackers',
      explanation: 'The page loads a large number of tracking scripts, leading to network congestion and slower execution.',
      businessImpact: 'Excessive trackers slow the page down, directly reducing customer conversion and engagement.',
      fix: 'Audit your analytics scripts. Consolidate them using Tag Managers and remove unused legacy trackers.',
    },
    developer: {
      title: 'Audit and Consolidate Third-Party Tag Managers',
      rootCause: 'Numerous tracker and pixel domains are configured, leading to massive DNS lookups and script overhead.',
      technicalImpact: 'Clogs network bandwidth and creates CPU execution bottlenecks.',
      codeExample: '// Consolidate trackers into server-side Google Tag Manager (sGTM)\n// instead of loading 10+ client-side scripts.',
      references: ['https://web.dev/efficiently-load-third-party-javascript/'],
    },
  },
  'dom/too-many-elements': {
    human: {
      title: 'Reduce DOM Size (Too Many Elements)',
      explanation: 'The web page has a massive number of elements (HTML tags). This makes the browser work harder to calculate styles and layout.',
      businessImpact: 'Laggy page scrolling, slow rendering, and sluggish response to clicks frustrate users.',
      fix: 'Simplify your page layouts, implement pagination or infinite scroll, and clean up nested wrappers.',
    },
    developer: {
      title: 'Simplify DOM Complexity and HTML Structure',
      rootCause: 'The page contains more than 800-1500 elements, often due to nested framework wrappers or repeating lists.',
      technicalImpact: 'Increases browser style calculation times and memory usage, causing repaint lag.',
      codeExample: '// Bad: unnecessary wrappers\n<div><div><p>Text</p></div></div>\n// Good: Flat DOM\n<p>Text</p>',
      references: ['https://web.dev/dom-size-and-interactive/'],
    },
  },
  'dom/deep-nesting': {
    human: {
      title: 'Reduce DOM Nesting Depth',
      explanation: 'The HTML elements on this page are nested extremely deeply inside each other, slowing down styling calculations.',
      businessImpact: 'Sluggish UI updates and laggy response times, leading to user frustration.',
      fix: 'Flatten your HTML hierarchy. Avoid deeply nested grid or flexbox containers unless absolutely necessary.',
    },
    developer: {
      title: 'Flatten the HTML Hierarchy',
      rootCause: 'Elements are nested deeper than 32 levels, causing the CSS engine to perform highly recursive matching algorithms.',
      technicalImpact: 'Degrades rendering pipeline efficiency (Recalculate Style & Layout steps).',
      codeExample: '/* Use CSS Grid or Flexbox to build flat structures instead of nesting nesting nesting */',
      references: ['https://web.dev/dom-size-and-interactive/'],
    },
  },
};

export function getFallbackExplanation(ruleId: string): AIExplanation {
  const match = LOCAL_FALLBACKS[ruleId];
  if (match) return match;

  return {
    human: {
      title: `Optimize ${ruleId}`,
      explanation: 'An optimization opportunity was detected that could improve user loading speed and site responsiveness.',
      businessImpact: 'A faster page leads to better conversion rates, improved user satisfaction, and better SEO rankings.',
      fix: 'Review the flagged element or resource and apply standard performance optimization techniques like caching, compression, or deferring.',
    },
    developer: {
      title: `Optimize ${ruleId}`,
      rootCause: `Metric analysis indicates room for improvement in ${ruleId}.`,
      technicalImpact: 'Contributes to loading bottlenecks.',
      codeExample: '/* Audit the affected resources and compress or defer them */',
      references: ['https://web.dev/fast/'],
    },
  };
}
