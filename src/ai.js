
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

async function generateReply(message) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    const error = new Error('Gemini API key is missing. Add GEMINI_API_KEY in Render Environment settings.');
    error.statusCode = 503;
    throw error;
  }

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(DEFAULT_MODEL) +
    ':generateContent';

  let response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      }),
      signal: AbortSignal.timeout(60000)
    });
  } catch {
    const error = new Error('Could not connect to Gemini. Check the server connection and try again.');
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const messageFromApi = data?.error?.message;
    const error = new Error(
      messageFromApi || `Gemini request failed with HTTP ${response.status}.`
    );
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }

  const reply = data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();

  if (!reply) {
    throw new Error('Gemini returned no text. Please try asking another question.');
  }

  return { reply, model: DEFAULT_MODEL };
}

module.exports = { generateReply, DEFAULT_MODEL };
