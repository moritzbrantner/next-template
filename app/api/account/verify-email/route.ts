import { verifyEmailByToken } from '@/src/auth/account-lifecycle';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Missing token.' }, { status: 400 });
  }

  const result = await verifyEmailByToken(token);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true });
}
