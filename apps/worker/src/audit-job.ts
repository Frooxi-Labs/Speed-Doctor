export interface AuditJobPayload {
  websiteId: string;
  url: string;
  projectId?: string;
  userId?: string;
  requestedAt?: string;
}
