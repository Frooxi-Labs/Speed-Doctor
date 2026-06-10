export interface ParsedTag {
  tagName: string;
  attrs: Record<string, string>;
  outerHtml: string;
}

export function parseHtmlTags(html: string, tagName: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  const tagRegex = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const outerHtml = match[0] || '';
    const attrString = match[1] || '';
    const attrs: Record<string, string> = {};
    
    const attrRegex = /(\w+)(?:\s*=\s*(?:['"]([^'"]*)['"]|(\S+)))?/gi;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      const key = attrMatch[1]?.toLowerCase();
      const val = attrMatch[2] ?? attrMatch[3] ?? '';
      if (key) {
        attrs[key] = val;
      }
    }

    tags.push({
      tagName: tagName.toLowerCase(),
      attrs,
      outerHtml,
    });
  }
  return tags;
}

export function analyzeDomTree(html: string) {
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  const tagRegex = /<\/?([a-zA-Z0-9:-]+)(?:\s+[^>]*)?>/g;
  let match;
  let currentDepth = 0;
  let maxDepth = 0;
  let totalElements = 0;

  const ignoreTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const fullTag = match[0] || '';
    const isClose = fullTag.startsWith('</');
    const isSelfClosing = fullTag.endsWith('/>');
    const tagName = match[1]?.toLowerCase();
    if (!tagName) continue;

    if (isClose) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else {
      totalElements++;
      if (!isSelfClosing && !ignoreTags.has(tagName)) {
        currentDepth++;
        if (currentDepth > maxDepth) {
          maxDepth = currentDepth;
        }
      }
    }
  }

  return { totalElements, maxDepth };
}
