export { analyzeDom } from './dom-analyzer';
export { analyzeDomTree, parseHtmlTags } from './utils';
export { detectImageIssues } from './detectors/images';
export { detectVideoIssues } from './detectors/videos';
export { detectFontIssues } from './detectors/fonts';
export { detectJavascriptIssues } from './detectors/javascript';
export { detectThirdPartyIssues } from './detectors/third-party';
export { detectDomComplexityIssues } from './detectors/dom-complexity';
export type { ParsedTag } from './utils';
