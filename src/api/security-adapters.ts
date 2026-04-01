import { auditAction, enforceRateLimit, getRateLimitKey, type AuditRecord } from "@/src/api/security";

export async function enforceAdminReportsRateLimit(request: Request, actorId: string | null) {
  const key = getRateLimitKey(request, actorId);
  return enforceRateLimit(key);
}

export async function auditAdminReportsAction(record: AuditRecord) {
  return auditAction(record);
}
