import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE_NAME = 'devoirs_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : '';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(request) {
  const header = request.headers?.cookie ?? '';
  return Object.fromEntries(header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) return [part, ''];
      return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
    }));
}

export function getAdminCredentials() {
  return {
    username: process.env.DEVOIRS_ADMIN_USERNAME || 'admin',
    password: getRequiredEnv('DEVOIRS_ADMIN_PASSWORD'),
    sessionSecret: getRequiredEnv('DEVOIRS_SESSION_SECRET'),
  };
}

export function createSessionCookie(session) {
  const { sessionSecret } = getAdminCredentials();
  if (!sessionSecret) throw new Error('DEVOIRS_SESSION_SECRET manquante côté serveur.');

  const payload = base64UrlEncode(JSON.stringify({
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }));
  const signature = signPayload(payload, sessionSecret);
  const secureFlag = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${SESSION_COOKIE_NAME}=${payload}.${signature}; HttpOnly;${secureFlag} SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function createExpiredSessionCookie() {
  const secureFlag = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${SESSION_COOKIE_NAME}=; HttpOnly;${secureFlag} SameSite=Strict; Path=/; Max-Age=0`;
}

export function readSessionFromRequest(request) {
  const { sessionSecret } = getAdminCredentials();
  if (!sessionSecret) return null;

  const cookie = parseCookies(request)[SESSION_COOKIE_NAME];
  if (!cookie) return null;
  const [payload, signature] = cookie.split('.');
  if (!payload || !signature) return null;
  const expectedSignature = signPayload(payload, sessionSecret);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload));
    if (session?.role !== 'admin' || typeof session.username !== 'string') return null;
    if (typeof session.exp !== 'number' || session.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: session.username, role: 'admin' };
  } catch {
    return null;
  }
}

export function requireAdminSession(request, response) {
  const { sessionSecret } = getAdminCredentials();
  if (!sessionSecret) {
    response.status(503).json({ error: 'DEVOIRS_SESSION_SECRET manquante côté serveur.' });
    return null;
  }

  const session = readSessionFromRequest(request);
  if (session) return session;
  response.status(401).json({ error: 'Session administrateur requise.' });
  return null;
}
