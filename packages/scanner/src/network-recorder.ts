import { type Page, type Request, type Response } from 'playwright-core';
import { type NetworkRequest } from '@speed-doctor/shared-types';

export class NetworkRecorder {
  private requests: NetworkRequest[] = [];
  // Index of the first request per `${method} ${url}` for O(1) response matching.
  private index = new Map<string, NetworkRequest>();

  constructor(private readonly page: Page) {
    this.page.on('request', this.onRequest.bind(this));
    this.page.on('response', this.onResponse.bind(this));
  }

  private key(method: string, url: string): string {
    return `${method} ${url}`;
  }

  private onRequest(request: Request) {
    const entry: NetworkRequest = {
      url: request.url(),
      resourceType: request.resourceType(),
      method: request.method(),
    };
    this.requests.push(entry);
    const k = this.key(entry.method, entry.url);
    if (!this.index.has(k)) this.index.set(k, entry);
  }

  private async onResponse(response: Response) {
    const req = response.request();
    const matchingReq = this.index.get(this.key(req.method(), response.url()));
    if (!matchingReq) return;

    let transferSize = 0;
    try {
      const sizes = await (response as any).sizes();
      transferSize = (sizes.responseBodySize || 0) + (sizes.responseHeadersSize || 0);
    } catch {
      transferSize = Number(response.headers()['content-length'] ?? 0);
    }

    matchingReq.status = response.status();
    matchingReq.transferSize = transferSize;
  }

  public getRequests(): NetworkRequest[] {
    return this.requests;
  }
}
