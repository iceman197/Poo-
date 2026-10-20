const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

function safeGoogleError(payload, status) {
  const message = payload && payload.error && payload.error.message;
  if (status === 400) return `Gemini rejected the request: ${message || 'check the prompt or request format'}.`;
  if (status === 401 || status === 403) return `Gemini API authentication/permission error: ${message || 'check that the API key is valid and enabled for the Gemini API'}.`;
  if (status === 404) return `Gemini model or endpoint not found: ${message || 'check GEMINI_MODEL in Render environment settings'}.`;
  if (status === 429) return `Gemini rate limit or quota reached: ${message || 'check your API quota and billing/usage limits'}.`;
  if (status >= 500) return `Gemini service error (HTTP ${status}): ${message || 'try again later'}.`;
  return `Gemini request failed (HTTP ${status}): ${message || 'unknown API error'}.`;
}

async function generateReply(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const error = new Error('GEMINI_API_KEY is missing from the server environment. Add it in Render → your service → Environment, then redeploy.');
    error.statusCode = 503;
    throw error;
  }

  const model = DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim()
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are ICEMAN AI, a helpful coding tutor inside ICEMAN CODE LEARN. Explain programming clearly for beginners, provide safe code examples, help debug errors, and never claim code was executed unless it actually was.'
            }]
          },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
        }),
        signal: controller.signal
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(safeGoogleError(data, response.status));
      error.statusCode = response.status === 429 ? 429 : (response.status >= 500 ? 502 : 400);
      throw error;
    }

    const reply = (data.candidates || [])
      .flatMap(candidate => candidate.content && candidate.content.parts ? candidate.content.parts : [])
      .map(part => part.text || '')
      .join('\n')
      .trim();

    if (!reply) {
      const reason = data.promptFeedback && data.promptFeedback.blockReason;
      const error = new Error(reason
        ? `Gemini did not return a reply because the prompt was blocked (${reason}). Try rephrasing it.`
        : 'Gemini returned an empty response. Please try again.');
      error.statusCode = 502;
      throw error;
    }
    return { reply, model };
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Gemini took too long to respond (45-second timeout). Try again.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateReply, DEFAULT_MODEL };
