import { isPrivateIp } from './ip-validator';

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

  const isPrivate = await isPrivateIp(url.hostname);
  if (isPrivate) {
    throw new Error('Private/internal IPs not allowed');
  }

  return url;
}
