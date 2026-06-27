import { createSessionCookie, getAdminCredentials } from '../auth-utils.js';

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Méthode non autorisée.' });
  }

  const { username, password, sessionSecret } = getAdminCredentials();
  if (!password || !sessionSecret) {
    return sendJson(response, 503, { error: 'Configuration d’authentification serveur manquante.' });
  }

  const submittedUsername = typeof request.body?.username === 'string' ? request.body.username.trim() : '';
  const submittedPassword = typeof request.body?.password === 'string' ? request.body.password : '';
  if (submittedUsername !== username || submittedPassword !== password) {
    return sendJson(response, 401, { error: 'Identifiants incorrects.' });
  }

  const session = { username, role: 'admin' };
  response.setHeader('Set-Cookie', createSessionCookie(session));
  return sendJson(response, 200, { session });
}
