import dns from 'dns';

export function isIpAddress(host: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(host) || ipv6Regex.test(host);
}

export function checkPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '0.0.0.0') return true;
  
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  
  const ipv4Parts = ip.split('.').map(Number);
  if (ipv4Parts.length === 4) {
    const p1 = ipv4Parts[0];
    const p2 = ipv4Parts[1];
    if (p1 === undefined || p2 === undefined) return true;
    
    // 172.16.0.0 - 172.31.255.255
    if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
    // 169.254.x.x (link-local)
    if (p1 === 169 && p2 === 254) return true;
    // 127.x.x.x
    if (p1 === 127) return true;
  }

  // IPv6 checks
  if (ip === '::1' || ip === '::') return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('FC') || ip.startsWith('FD')) return true;
  if (/^fe[89ab]/i.test(ip)) return true;

  return false;
}

export async function isPrivateIp(hostname: string): Promise<boolean> {
  const normalized = hostname.trim().toLowerCase();
  
  if (normalized === 'localhost' || normalized === 'localhost.localdomain') {
    return true;
  }

  if (isIpAddress(normalized)) {
    return checkPrivateIp(normalized);
  }

  try {
    const addresses = await dns.promises.resolve(hostname).catch(async () => {
      const res = await dns.promises.lookup(hostname);
      return [res.address];
    });

    for (const addr of addresses) {
      if (checkPrivateIp(addr)) {
        return true;
      }
    }
  } catch (err) {
    // If it cannot resolve, we let it fail gracefully during navigation,
    // but check if the hostname is a common private TLD just in case.
    if (normalized.endsWith('.local') || normalized.endsWith('.internal')) {
      return true;
    }
  }

  return false;
}
