import { type ScanResult, type RawIssue } from '@speed-doctor/shared-types';
import { detectImageIssues } from './detectors/images';
import { detectVideoIssues } from './detectors/videos';
import { detectFontIssues } from './detectors/fonts';
import { detectJavascriptIssues } from './detectors/javascript';
import { detectThirdPartyIssues } from './detectors/third-party';
import { detectDomComplexityIssues } from './detectors/dom-complexity';

export function analyzeDom(scanResult: ScanResult): RawIssue[] {
  // Collect a flat array of all assets to pass for third-party ratio calculation
  const allAssets = [
    ...scanResult.assets.images,
    ...scanResult.assets.scripts,
    ...scanResult.assets.styles,
    ...scanResult.assets.fonts,
    ...scanResult.assets.videos,
  ];

  return [
    ...detectImageIssues(scanResult.assets.images, scanResult.html),
    ...detectVideoIssues(scanResult.assets.videos, scanResult.html),
    ...detectFontIssues(scanResult.assets.fonts),
    ...detectJavascriptIssues(scanResult.assets.scripts, scanResult.html),
    ...detectThirdPartyIssues(scanResult.assets.thirdParty, allAssets),
    ...detectDomComplexityIssues(scanResult.html),
  ];
}
