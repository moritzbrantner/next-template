import { getRequest, useSession } from '@tanstack/react-start/server';

import type { AppSession, AppSessionUser } from '@/src/auth';
import { buildProfileImageUrl } from '@/src/profile/object-storage';

const SESSION_COOKIE_NAME = 'app-session';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const SESSION_SECRET = process.env.AUTH_SECRET ?? 'local-build-secret-local-build-secret';

type SessionPayload = {
  user?: AppSessionUser;
};

async function getSessionStore() {
  const request = getRequest();
  const requestUrl = request ? new URL(request.url) : null;
  const isSecureRequest = requestUrl?.protocol === 'https:' || process.env.AUTH_URL?.startsWith('https://');

  return useSession<SessionPayload>({
    name: SESSION_COOKIE_NAME,
    password: SESSION_SECRET,
    cookie: {
      secure: Boolean(isSecureRequest),
      sameSite: 'lax',
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  });
}

export async function getAuthSession(): Promise<AppSession | null> {
  const session = await getSessionStore();
  return session.data.user ? { user: session.data.user } : null;
}

export async function signInSession(user: Pick<AppSessionUser, 'id' | 'email' | 'name' | 'image' | 'role'>): Promise<AppSession> {
  const session = await getSessionStore();
  const normalizedUser: AppSessionUser = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: buildProfileImageUrl(user.image) ?? null,
    role: user.role,
  };

  await session.update({ user: normalizedUser });
  return { user: normalizedUser };
}

export async function signOutSession() {
  const session = await getSessionStore();
  await session.clear();
}
