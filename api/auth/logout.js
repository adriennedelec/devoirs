import { createExpiredSessionCookie } from '../auth-utils.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Set-Cookie', createExpiredSessionCookie());

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Méthode non autorisée.' });
  }

  return response.status(200).json({ ok: true });
}
