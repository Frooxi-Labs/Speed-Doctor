import { isPrivateHost } from './ip-validator';

export async function validateScanUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http/https URLs allowed');
  }

  if (await isPrivateHost(url.hostname)) {
    throw new Error('Private/internal IPs not allowed');
  }

  return url;
}

/**
 * Guard used during navigation to reject redirects/requests that land on a
 * private host. Returns true when the URL is safe to fetch.
 */
export async function isSafeNavigationUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  return !(await isPrivateHost(url.hostname));
}
