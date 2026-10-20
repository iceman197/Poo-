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

app.disable('x-powered-by');
app.set('trust proxy', 1);

// This frontend has inline CSS and JavaScript. CSP is disabled here to preserve
// the supplied single-file design; do not add untrusted HTML or scripts.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a little and try again.' }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'ICEMAN CODE LEARN' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'ICEMAN CODE LEARN' });
});

app.get('/api/ai/status', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    provider: 'Gemini',
    model: DEFAULT_MODEL
  });
});

app.get('/api/labs', (_req, res) => {
  res.json({ labs: getLabs() });
});

app.post('/api/ai/chat', aiLimiter, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Please enter a message for ICEMAN AI.' });
  if (message.length > 12000) {
    return res.status(413).json({ error: 'Your message is too long. Please keep it under 12,000 characters.' });
  }

  try {
    const result = await generateReply(message);
    return res.json({ reply: result.reply, provider: 'Gemini', model: result.model });
  } catch (error) {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 502;
    // Error details are useful for debugging; never log or return the API key.
    console.error('[AI chat]', error.message);
    return res.status(status).json({ error: error.message || 'AI request failed. Check the server logs.' });
  }
});

app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  console.error('[Server error]', err && err.message ? err.message : err);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ICEMAN CODE LEARN listening on port ${PORT}`);
  console.log(`Gemini API key configured: ${Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())}`);
  console.log(`Gemini model: ${DEFAULT_MODEL}`);
});
