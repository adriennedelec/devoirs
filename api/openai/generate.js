const DEFAULT_MODEL = 'gpt-4.1-mini';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return sendJson(response, 503, { error: 'OPENAI_API_KEY manquante côté serveur.' });
  }

  const prompt = normalizePrompt(request.body?.prompt);
  if (!prompt) {
    return sendJson(response, 400, { error: 'Prompt manquant.' });
  }

  const options = normalizeOptions(request.body?.options);
  const model = normalizeModel(request.body?.model || process.env.OPENAI_MODEL);

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
        max_output_tokens: typeof options.num_predict === 'number' ? options.num_predict : 420,
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
