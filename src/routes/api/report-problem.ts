import { createFileRoute } from '@tanstack/react-router';

const allowedAreas = new Set(['bug', 'performance', 'account', 'billing', 'other']);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function isValidOptionalUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const Route = createFileRoute('/api/report-problem')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData();

        const email = readString(formData, 'email');
        const area = readString(formData, 'area');
        const pageUrl = readString(formData, 'pageUrl');
        const subject = readString(formData, 'subject');
        const details = readString(formData, 'details');

        if (
          !isValidEmail(email) ||
          !allowedAreas.has(area) ||
          !isValidOptionalUrl(pageUrl) ||
          subject.length < 8 ||
          details.length < 30
        ) {
          return Response.json(
            {
              error: 'Please complete the form with a valid email, category, subject, and enough detail to investigate.',
            },
            { status: 400 },
          );
        }

        const referenceId = `PRB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

        return Response.json(
          {
            referenceId,
          },
          { status: 201 },
        );
      },
    },
  },
});
