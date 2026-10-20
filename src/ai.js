
const DEFAULT_MODEL =
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

async function generateReply(message) {
  const apiKey = process.env.GROQ_API_KEY;
  const baseURL =
    process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing from the server environment.');
  }

  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Please enter a message.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${baseURL.replace(/\/+$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are ICEMAN AI, a helpful coding assistant. ' +
                'Help users learn programming, debug code, and build websites.'
            },
            {
              role: 'user',
              content: message.trim()
            }
          ],
          max_tokens: 1024
        }),
        signal: controller.signal
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Groq API error:', response.status, data);
      throw new Error(
        response.status === 429
          ? 'Groq rate limit reached. Please wait and try again.'
          : response.status === 401
          ? 'Groq API key is invalid or unauthorized.'
          : `Groq API request failed (${response.status}).`
      );
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('Groq returned an empty response.');
    }

    return {
      reply: reply.trim(),
      model: data.model || DEFAULT_MODEL
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Groq request timed out. Please try again.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateReply,
  DEFAULT_MODEL
};
