import { type Page, type Request, type Response } from 'playwright-core';
import { type NetworkRequest } from '@speed-doctor/shared-types';

export class NetworkRecorder {
  private requests: NetworkRequest[] = [];

  constructor(private readonly page: Page) {
    this.page.on('request', this.onRequest.bind(this));
    this.page.on('response', this.onResponse.bind(this));
  }

  private onRequest(request: Request) {
    this.requests.push({
      url: request.url(),
      resourceType: request.resourceType(),
      method: request.method(),
    });
  }

  private async onResponse(response: Response) {
    const url = response.url();
    const req = response.request();
    const matchingReq = this.requests.find(
      (r) => r.url === url && r.method === req.method()
    );

    let transferSize = 0;
    try {
      const sizes = await (response as any).sizes();
      transferSize = (sizes.responseBodySize || 0) + (sizes.responseHeadersSize || 0);
    } catch {
      transferSize = Number(response.headers()['content-length'] ?? 0);
    }

    if (matchingReq) {
      matchingReq.status = response.status();
      matchingReq.transferSize = transferSize;
    }
  }

  public getRequests(): NetworkRequest[] {
    return this.requests;
  }
}
