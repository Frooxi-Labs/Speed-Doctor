import dns from 'dns';
import net from 'net';

/**
 * Returns true if the given IP literal points at a private, loopback,
 * link-local, or otherwise non-routable address that we must never scan
 * (SSRF protection). Handles both IPv4 and IPv6, including IPv4-mapped IPv6.
 */
export function checkPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) return isPrivateIpv6(ip);
  // Not a valid IP literal — treat as unsafe so callers fail closed.
  return true;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return true;
  }
  const [a, b] = parts as [number, number, number, number];

  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata 169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24 (test)
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmarking
  if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  if (lower === '::1' || lower === '::') return true; // loopback / unspecified

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible — extract and re-check as IPv4.
  const mapped = lower.match(/(?:::ffff:|::)((?:\d{1,3}\.){3}\d{1,3})$/);
  if (mapped && mapped[1]) return isPrivateIpv4(mapped[1]);

  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true; // fe80::/10 link-local
  }
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7 unique local
  if (lower.startsWith('ff')) return true; // ff00::/8 multicast

  return false;
}

/**
 * Resolves a hostname (or accepts an IP literal) and returns true if it — or
 * ANY of its resolved addresses — points at a private/internal target.
 * Fails closed: an unresolvable host or a host with no public address is
 * treated as private.
 */
export async function isPrivateHost(hostname: string): Promise<boolean> {
  const normalized = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');

  if (
    normalized === 'localhost' ||
    normalized === 'localhost.localdomain' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    return true;
  }

  if (net.isIP(normalized)) {
    return checkPrivateIp(normalized);
  }

  let addresses: string[];
  try {
    addresses = await resolveAll(normalized);
  } catch {
    // Could not resolve — fail closed.
    return true;
  }

  if (addresses.length === 0) return true;
  return addresses.some(checkPrivateIp);
}

/** Resolve both A and AAAA records; returns every address we can find. */
async function resolveAll(hostname: string): Promise<string[]> {
  const results = await Promise.allSettled([
    dns.promises.resolve4(hostname),
    dns.promises.resolve6(hostname),
  ]);

  const addresses: string[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') addresses.push(...r.value);
  }

  if (addresses.length === 0) {
    // Fall back to the system resolver (covers /etc/hosts, mDNS, etc.).
    const all = await dns.promises.lookup(hostname, { all: true });
    addresses.push(...all.map((a) => a.address));
  }

  return addresses;
}

/** Backwards-compatible alias. */
export const isPrivateIp = isPrivateHost;

export function isIpAddress(host: string): boolean {
  return net.isIP(host) !== 0;
}
