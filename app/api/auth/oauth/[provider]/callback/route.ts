import { completeOAuthFlow } from '@/src/auth/oauth/service';
import { isAuthProvider } from '@/src/auth/oauth/providers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;

  if (!isAuthProvider(rawProvider)) {
    return new Response(null, { status: 404 });
  }

  return completeOAuthFlow(rawProvider, request);
}
