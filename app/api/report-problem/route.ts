import { secureRoute } from '@/src/api/route-security';
import { createProblemReport } from '@/src/domain/support/problem-reports';

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'support.reportProblem',
    requiredFeatureKey: 'reportProblem',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const formData = await request.formData();
  const result = await createProblemReport({
    name: readString(formData, 'name'),
    email: readString(formData, 'email'),
    area: readString(formData, 'area'),
    pageUrl: readString(formData, 'pageUrl'),
    subject: readString(formData, 'subject'),
    details: readString(formData, 'details'),
  });

  if (!result.ok) {
    return guard.json(
      {
        error: result.error,
      },
      { status: 400 },
    );
  }

  return guard.json(
    { referenceId: result.value.referenceId },
    {
      status: 201,
      metadata: { reportId: result.value.id },
    },
  );
}
