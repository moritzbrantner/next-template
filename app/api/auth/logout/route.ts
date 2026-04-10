import { signOutSession } from '@/src/auth.server';

export async function POST() {
  await signOutSession();
  return Response.json({ ok: true });
}
