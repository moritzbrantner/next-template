import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { requireRole } from "@/lib/authorization";
import { authOptions } from "@/src/auth";
import { auditAction, enforceRateLimit, getRateLimitKey } from "@/src/api/security";
import { getAdminActionPermissions } from "@/src/domain/authorization/use-cases";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id ?? null;
  const action = "viewReports";

  const rateLimitKey = getRateLimitKey(request, actorId);
  const rateLimit = enforceRateLimit(rateLimitKey);

  if (!rateLimit.ok) {
    auditAction({
      actorId,
      action,
      outcome: "rate_limited",
      statusCode: 429,
    });

    return NextResponse.json(
      { error: "Rate limit exceeded." },
      {
        status: 429,
        headers: {
          "retry-after": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const authorizedSession = await requireRole("ADMIN");
    const [reportsPermission] = getAdminActionPermissions(authorizedSession.user.role).filter(
      (permission) => permission.key === "viewReports",
    );

    auditAction({
      actorId: authorizedSession.user.id,
      action,
      outcome: "allowed",
      statusCode: 200,
      metadata: {
        remainingBudget: rateLimit.remaining,
      },
    });

    return NextResponse.json(
      {
        action,
        allowed: reportsPermission?.allowed ?? false,
      },
      {
        status: 200,
        headers: {
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(rateLimit.resetAt),
        },
      },
    );
  } catch (error) {
    const status = (error as { status?: number })?.status;

    if (status === 401 || status === 403) {
      auditAction({
        actorId,
        action,
        outcome: "denied",
        statusCode: status,
      });

      return NextResponse.json(
        {
          error: status === 401 ? "Authentication required." : "Forbidden.",
        },
        { status },
      );
    }

    auditAction({
      actorId,
      action,
      outcome: "error",
      statusCode: 500,
    });

    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
