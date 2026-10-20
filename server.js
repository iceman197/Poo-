
require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { generateReply, DEFAULT_MODEL } = require('./src/ai');
const { getLabs } = require('./src/labs');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');

const AI_PROVIDER = 'Groq';

function isAIConfigured() {
  return Boolean(
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY.trim()
  );
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Preserve the existing frontend design.
// Revisit CSP settings before adding untrusted scripts or HTML.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests. Please wait a little and try again.'
  }
});

// Basic health checks
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'ICEMAN CODE LEARN'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'ICEMAN CODE LEARN'
  });
});

// AI connection status
app.get('/api/ai/status', (_req, res) => {
  const configured = isAIConfigured();

  res.json({
    ok: true,
    configured,
    provider: AI_PROVIDER,
    model: DEFAULT_MODEL
  });
});

// Coding labs
app.get('/api/labs', (_req, res) => {
  try {
    res.json({ labs: getLabs() });
  } catch (error) {
    console.error('[Labs]', error.message);
    res.status(500).json({
      error: 'Unable to load coding labs.'
    });
  }
});

// AI chat
app.post('/api/ai/chat', aiLimiter, async (req, res) => {
  const message =
    typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';

  if (!message) {
    return res.status(400).json({
      error: 'Please enter a message for ICEMAN AI.'
    });
  }

  if (message.length > 12000) {
    return res.status(413).json({
      error: 'Your message is too long. Please keep it under 12,000 characters.'
    });
  }

  if (!isAIConfigured()) {
    return res.status(503).json({
      error: 'Groq AI is not configured. Add GROQ_API_KEY in Render Environment.'
    });
  }

  try {
    const result = await generateReply(message);

    if (!result || typeof result.reply !== 'string') {
      throw new Error('The AI provider returned an invalid response.');
    }

    return res.json({
      reply: result.reply,
      provider: AI_PROVIDER,
      model: result.model || DEFAULT_MODEL
    });
  } catch (error) {
    console.error('[AI chat]', error.message);

    const status = Number.isInteger(error.statusCode)
      && error.statusCode >= 400
      && error.statusCode < 600
      ? error.statusCode
      : 502;

    return res.status(status).json({
      error: error.message || 'AI request failed. Check the server logs.'
    });
  }
});

// Serve website files
app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

// Serve the main frontend for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request body is too large.'
    });
  }

  console.error(
    '[Server error]',
    err && err.message ? err.message : err
  );

  return res.status(500).json({
    error: 'Internal server error.'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ICEMAN CODE LEARN listening on port ${PORT}`);
  console.log(`AI provider: ${AI_PROVIDER}`);
  console.log(`Groq API key configured: ${isAIConfigured()}`);
  console.log(`AI model: ${DEFAULT_MODEL}`);
});
