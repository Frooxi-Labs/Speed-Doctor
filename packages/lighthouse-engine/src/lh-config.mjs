// Shared Lighthouse run configuration.
//
// IMPORTANT: Lighthouse applies its *mobile Slow-4G + 4x CPU* throttling by
// default when `throttling` is omitted — even for `formFactor: 'desktop'`.
// That is the single biggest reason desktop scores come out far lower than
// Google PageSpeed Insights. We therefore set the throttling block explicitly
// to match the official PSI presets:
//   desktop -> desktopDense4G  (1x CPU, 40ms RTT, 10 Mbps)
//   mobile  -> mobileSlow4G    (4x CPU, 150ms RTT, ~1.6 Mbps)
//
// Values mirror lighthouse/core/config/constants.js so our numbers track PSI.

const DESKTOP_THROTTLING = {
  rttMs: 40,
  throughputKbps: 10 * 1024,
  cpuSlowdownMultiplier: 1,
  requestLatencyMs: 0,
  downloadThroughputKbps: 0,
  uploadThroughputKbps: 0,
};

const MOBILE_THROTTLING = {
  rttMs: 150,
  throughputKbps: 1.6 * 1024,
  requestLatencyMs: 150 * 3.75,
  downloadThroughputKbps: 1.6 * 1024 * 0.9,
  uploadThroughputKbps: 750 * 0.9,
  cpuSlowdownMultiplier: 4,
};

const DESKTOP_SCREEN = { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false };
const MOBILE_SCREEN = { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false };

/**
 * Build the Lighthouse options object for a given device, with throttling that
 * matches the official PageSpeed Insights presets.
 * @param {'mobile' | 'desktop'} device
 * @param {number} port  Chrome debugging port
 */
export function buildLighthouseOptions(device, port) {
  const isMobile = device === 'mobile';
  return {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port,
    formFactor: isMobile ? 'mobile' : 'desktop',
    screenEmulation: isMobile ? MOBILE_SCREEN : DESKTOP_SCREEN,
    throttlingMethod: 'simulate',
    throttling: isMobile ? MOBILE_THROTTLING : DESKTOP_THROTTLING,
  };
}
