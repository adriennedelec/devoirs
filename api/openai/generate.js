import { sql } from '@vercel/postgres';
import { requireAdminSession } from '../auth-utils.js';

const DEFAULT_MODEL = 'gpt-4.1-mini';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
export const OPENAI_MAX_BODY_BYTES = 64 * 1024;
export const OPENAI_MAX_PROMPT_CHARS = 12_000;
export const OPENAI_MAX_OUTPUT_TOKENS = 800;
export const OPENAI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const OPENAI_RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitBuckets = new Map();

const RATE_LIMIT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS devoirs_openai_rate_limits (
    rate_key TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL,
    reset_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function normalizePrompt(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeModel(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return DEFAULT_MODEL;
  const requestedModel = value.trim();
  return requestedModel === DEFAULT_MODEL ? requestedModel : DEFAULT_MODEL;
}

function normalizeOptions(value) {
  if (!value || typeof value !== 'object') return {};
  return value;
}

function getBodySize(body) {
  return Buffer.byteLength(JSON.stringify(body ?? {}), 'utf8');
}

function normalizeMaxOutputTokens(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 420;
  return Math.max(1, Math.min(Math.floor(value), OPENAI_MAX_OUTPUT_TOKENS));
}

export function validateOpenAiRequestBody(body) {
  if (getBodySize(body) > OPENAI_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Requête trop volumineuse.' };
  }

  const prompt = normalizePrompt(body?.prompt);
  if (!prompt) {
    return { ok: false, status: 400, error: 'Prompt manquant.' };
  }
  if (prompt.length > OPENAI_MAX_PROMPT_CHARS) {
    return { ok: false, status: 413, error: `Prompt trop long (${OPENAI_MAX_PROMPT_CHARS} caractères maximum).` };
  }

  return {
    ok: true,
    prompt,
    options: normalizeOptions(body?.options),
    model: normalizeModel(body?.model || process.env.OPENAI_MODEL),
  };
}

function getHeader(request, name) {
  return request.headers?.[name] ?? request.headers?.[name.toLowerCase()] ?? '';
}

function getClientIp(request) {
  const forwardedFor = String(getHeader(request, 'x-forwarded-for') || '');
  return forwardedFor.split(',')[0].trim() || String(getHeader(request, 'x-real-ip') || 'unknown');
}

function getRateLimitKey(request, session) {
  return `${session.username}:${getClientIp(request)}`;
}

export function consumeOpenAiRateLimit(key, now = Date.now()) {
  const currentBucket = rateLimitBuckets.get(key);
  if (!currentBucket || now >= currentBucket.resetAt) {
    const resetAt = now + OPENAI_RATE_LIMIT_WINDOW_MS;
    rateLimitBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: OPENAI_RATE_LIMIT_MAX_REQUESTS - 1, resetAt };
  }

  if (currentBucket.count >= OPENAI_RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: currentBucket.resetAt };
  }

  currentBucket.count += 1;
  return { allowed: true, remaining: OPENAI_RATE_LIMIT_MAX_REQUESTS - currentBucket.count, resetAt: currentBucket.resetAt };
}

function getRateLimitResetDate(now) {
  return new Date(now + OPENAI_RATE_LIMIT_WINDOW_MS);
}

function getResetAtMs(value) {
  const resetAtMs = new Date(value).getTime();
  return Number.isFinite(resetAtMs) ? resetAtMs : Date.now() + OPENAI_RATE_LIMIT_WINDOW_MS;
}

async function ensureRateLimitTable(database = sql) {
  await database.query(RATE_LIMIT_TABLE_SQL);
}

export async function consumePersistentOpenAiRateLimit(key, now = Date.now(), database = sql) {
  await ensureRateLimitTable(database);

  const existing = await database.query(
    'SELECT request_count, reset_at FROM devoirs_openai_rate_limits WHERE rate_key = $1 LIMIT 1',
    [key],
  );
  const row = existing.rows[0];
  const resetAt = getRateLimitResetDate(now);

  if (!row || getResetAtMs(row.reset_at) <= now) {
    await database.query(
      `INSERT INTO devoirs_openai_rate_limits (rate_key, request_count, reset_at, updated_at)
       VALUES ($1, 1, $2, NOW())
       ON CONFLICT (rate_key)
       DO UPDATE SET request_count = 1, reset_at = EXCLUDED.reset_at, updated_at = NOW()`,
      [key, resetAt.toISOString()],
    );
    return { allowed: true, remaining: OPENAI_RATE_LIMIT_MAX_REQUESTS - 1, resetAt: resetAt.getTime(), source: 'postgres' };
  }

  const currentCount = Number(row.request_count) || 0;
  const currentResetAt = getResetAtMs(row.reset_at);
  if (currentCount >= OPENAI_RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: currentResetAt, source: 'postgres' };
  }

  const updated = await database.query(
    `UPDATE devoirs_openai_rate_limits
     SET request_count = request_count + 1, updated_at = NOW()
     WHERE rate_key = $1
     RETURNING request_count, reset_at`,
    [key],
  );
  const updatedRow = updated.rows[0] ?? { request_count: currentCount + 1, reset_at: row.reset_at };
  const updatedCount = Number(updatedRow.request_count) || currentCount + 1;
  return {
    allowed: true,
    remaining: Math.max(0, OPENAI_RATE_LIMIT_MAX_REQUESTS - updatedCount),
    resetAt: getResetAtMs(updatedRow.reset_at),
    source: 'postgres',
  };
}

async function consumeOpenAiRateLimitWithFallback(key) {
  try {
    return await consumePersistentOpenAiRateLimit(key);
  } catch {
    return { ...consumeOpenAiRateLimit(key), source: 'memory-fallback' };
  }
}

export function resetOpenAiRateLimitForTests() {
  rateLimitBuckets.clear();
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;

  const parts = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Méthode non autorisée.' });
  }

  const session = requireAdminSession(request, response);
  if (!session) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return sendJson(response, 503, { error: 'OPENAI_API_KEY manquante côté serveur.' });
  }

  const validation = validateOpenAiRequestBody(request.body);
  if (!validation.ok) {
    return sendJson(response, validation.status, { error: validation.error });
  }

  const { prompt, options, model } = validation;

  const rateLimit = await consumeOpenAiRateLimitWithFallback(getRateLimitKey(request, session));
  response.setHeader('X-RateLimit-Limit', String(OPENAI_RATE_LIMIT_MAX_REQUESTS));
  response.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.setHeader('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
  if (!rateLimit.allowed) {
    response.setHeader('Retry-After', String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
    return sendJson(response, 429, { error: 'Trop de générations IA. Réessaie dans quelques minutes.' });
  }

  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: typeof options.temperature === 'number' ? options.temperature : 0.25,
        max_output_tokens: normalizeMaxOutputTokens(options.num_predict),
      }),
    });

    const payload = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      const message = payload?.error?.message || `OpenAI a répondu ${openAiResponse.status}.`;
      return sendJson(response, openAiResponse.status, { error: message });
    }

    const text = extractResponseText(payload);
    if (!text) {
      return sendJson(response, 502, { error: 'OpenAI n’a pas renvoyé de texte lisible.' });
    }

    return sendJson(response, 200, {
      response: text,
      model,
      provider: 'openai',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Appel OpenAI impossible.';
    return sendJson(response, 502, { error: message });
  }
}
