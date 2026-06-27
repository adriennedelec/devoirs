import { describe, expect, it, afterEach } from 'vitest';
import {
  OPENAI_MAX_BODY_BYTES,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MAX_PROMPT_CHARS,
  OPENAI_RATE_LIMIT_MAX_REQUESTS,
  OPENAI_RATE_LIMIT_WINDOW_MS,
  consumeOpenAiRateLimit,
  consumePersistentOpenAiRateLimit,
  resetOpenAiRateLimitForTests,
  validateOpenAiRequestBody,
} from '../api/openai/generate.js';

describe('api/openai/generate guards', () => {
  afterEach(() => {
    resetOpenAiRateLimitForTests();
  });

  it('rejects missing, oversized prompt and oversized request body', () => {
    expect(validateOpenAiRequestBody({ prompt: '' })).toMatchObject({ ok: false, status: 400 });
    expect(validateOpenAiRequestBody({ prompt: 'a'.repeat(OPENAI_MAX_PROMPT_CHARS + 1) })).toMatchObject({ ok: false, status: 413 });
    expect(validateOpenAiRequestBody({ prompt: 'ok', extra: 'a'.repeat(OPENAI_MAX_BODY_BYTES) })).toMatchObject({ ok: false, status: 413 });
  });

  it('normalizes the accepted OpenAI request body without allowing arbitrary models', () => {
    expect(validateOpenAiRequestBody({
      model: 'unknown-expensive-model',
      prompt: ' Raconte une histoire. ',
      options: { num_predict: OPENAI_MAX_OUTPUT_TOKENS + 1 },
    })).toMatchObject({
      ok: true,
      prompt: 'Raconte une histoire.',
      model: 'gpt-4.1-mini',
    });
  });

  it('limits repeated OpenAI generations per key and resets after the window', () => {
    const key = 'admin:127.0.0.1';
    const now = 1_000;

    for (let index = 0; index < OPENAI_RATE_LIMIT_MAX_REQUESTS; index += 1) {
      expect(consumeOpenAiRateLimit(key, now).allowed).toBe(true);
    }

    const blocked = consumeOpenAiRateLimit(key, now);
    expect(blocked).toMatchObject({ allowed: false, remaining: 0 });

    const reset = consumeOpenAiRateLimit(key, now + OPENAI_RATE_LIMIT_WINDOW_MS + 1);
    expect(reset).toMatchObject({ allowed: true, remaining: OPENAI_RATE_LIMIT_MAX_REQUESTS - 1 });
  });

  it('persists OpenAI generation limits in Postgres-compatible storage', async () => {
    const key = 'admin:127.0.0.1';
    const now = 1_000;
    const calls = [];
    const database = {
      async query(statement, params) {
        calls.push({ statement, params });
        if (String(statement).startsWith('SELECT')) return { rows: [] };
        return { rows: [] };
      },
    };

    await expect(consumePersistentOpenAiRateLimit(key, now, database)).resolves.toMatchObject({
      allowed: true,
      remaining: OPENAI_RATE_LIMIT_MAX_REQUESTS - 1,
      source: 'postgres',
    });
    expect(calls.some((call) => String(call.statement).includes('CREATE TABLE IF NOT EXISTS devoirs_openai_rate_limits'))).toBe(true);
    expect(calls.some((call) => String(call.statement).includes('INSERT INTO devoirs_openai_rate_limits'))).toBe(true);
  });

  it('blocks persistent OpenAI generations until the stored reset time', async () => {
    const key = 'admin:127.0.0.1';
    const now = 1_000;
    const resetAt = new Date(now + OPENAI_RATE_LIMIT_WINDOW_MS);
    const database = {
      async query(statement) {
        if (String(statement).startsWith('SELECT')) {
          return { rows: [{ request_count: OPENAI_RATE_LIMIT_MAX_REQUESTS, reset_at: resetAt.toISOString() }] };
        }
        return { rows: [] };
      },
    };

    await expect(consumePersistentOpenAiRateLimit(key, now, database)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      resetAt: resetAt.getTime(),
      source: 'postgres',
    });
  });
});
