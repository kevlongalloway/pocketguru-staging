'use strict';

const express     = require('express');
const bcrypt      = require('bcryptjs');
const crypto      = require('crypto');
const https       = require('https');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const db          = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve PWA static files
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────────────────────────────

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve(raw); } });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// OpenAI chat completions (used for both chat and text-generation features)
async function openaiChat(messages, maxTokens = 500) {
  return httpsPost('api.openai.com', '/v1/chat/completions',
    { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    { model: 'gpt-3.5-turbo', messages, max_tokens: maxTokens }
  );
}

// Generate a Sanctum-compatible opaque token: "id|plainToken"
function generateToken(userId) {
  const plain = crypto.randomBytes(40).toString('hex');
  const hash  = crypto.createHash('sha256').update(plain).digest('hex');
  const row   = db.prepare(
    'INSERT INTO personal_access_tokens (tokenable_id, name, token) VALUES (?, ?, ?)'
  ).run(userId, 'auth_token', hash);
  return `${row.lastInsertRowid}|${plain}`;
}

// Auth middleware — reads "Authorization: Bearer id|token"
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthenticated.' });
  const raw = header.slice(7);
  const pipe = raw.indexOf('|');
  if (pipe === -1) return res.status(401).json({ error: 'Invalid token.' });
  const id        = raw.slice(0, pipe);
  const plain     = raw.slice(pipe + 1);
  const hash      = crypto.createHash('sha256').update(plain).digest('hex');
  const tokenRow  = db.prepare('SELECT * FROM personal_access_tokens WHERE id = ? AND token = ?').get(id, hash);
  if (!tokenRow) return res.status(401).json({ error: 'Unauthenticated.' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(tokenRow.tokenable_id);
  if (!user) return res.status(401).json({ error: 'Unauthenticated.' });
  req.user     = user;
  req.tokenRow = tokenRow;
  next();
}

// ── Auth routes ───────────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.length > 255)
    return res.json({ error: 'Name is required and must be at most 255 characters.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.json({ error: 'A valid email is required.' });
  if (!password || password.length < 8)
    return res.json({ error: 'Password must be at least 8 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.json({ error: 'The email has already been taken.' });

  const hashed = bcrypt.hashSync(password, 10);
  const row    = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashed);
  const token  = generateToken(row.lastInsertRowid);
  res.json({ access_token: token, token_type: 'Bearer' });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.json({ error: 'Email is required.' });
  if (!password) return res.json({ error: 'Password is required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user.id);
  res.json({ access_token: token, token_type: 'Bearer' });
});

// GET /api/logout/:token
app.get('/api/logout/:token', (req, res) => {
  const raw  = req.params.token;
  const pipe = raw.indexOf('|');
  if (pipe === -1) return res.json({ error: 'Token not found.' });
  const id   = raw.slice(0, pipe);
  const plain = raw.slice(pipe + 1);
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  const deleted = db.prepare('DELETE FROM personal_access_tokens WHERE id = ? AND token = ?').run(id, hash);
  if (deleted.changes === 0) return res.json({ error: 'Token not found.' });
  res.json({ success: true });
});

// GET /api/check-authentication
app.get('/api/check-authentication', auth, (req, res) => {
  res.json({ authenticated: true });
});

// GET /api/user
app.get('/api/user', auth, (req, res) => {
  const { password, ...safe } = req.user;
  res.json(safe);
});

// ── Chat routes ───────────────────────────────────────────────────────────────

// GET /api/chat — return conversation history
app.get('/api/chat', auth, (req, res) => {
  res.json(req.user.conversation_history);
});

// POST /api/chat
app.post('/api/chat', auth, async (req, res) => {
  const message = req.body.message;
  if (!message || message.length > 2048)
    return res.json({ error: 'Message is required and must be under 2048 characters.' });

  let history = [];
  try { history = JSON.parse(req.user.conversation_history) || []; } catch (_) {}

  // Keep last 10 exchanges
  if (history.length > 10) history.shift();

  // Find or pick a system message
  let systemContent = null;
  for (const h of history) { if (h.role === 'system') { systemContent = h.content; break; } }
  if (!systemContent) {
    const row = db.prepare('SELECT content FROM system_messages WHERE service_id = 1 ORDER BY RANDOM() LIMIT 1').get();
    systemContent = row ? row.content : 'You are PocketGuru, a helpful mental wellness AI assistant.';
  }

  const messages = [{ role: 'system', content: systemContent }, ...history.filter(h => h.role !== 'system'), { role: 'user', content: message }];

  try {
    const data  = await openaiChat(messages);
    const reply = data.choices[0].message.content;

    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: reply });

    db.prepare('UPDATE users SET conversation_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(history), req.user.id);

    res.json({ response: reply, history });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// GET /api/reset-conversation
app.get('/api/reset-conversation', auth, (req, res) => {
  db.prepare('UPDATE users SET conversation_history = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);
  res.json({ message: 'Conversation history has been reset.' });
});

// ── Text completion routes ────────────────────────────────────────────────────

async function textCompletion(serviceId, fallbackPrompt) {
  const row    = db.prepare('SELECT content FROM system_messages WHERE service_id = ? ORDER BY RANDOM() LIMIT 1').get(serviceId);
  const prompt = row ? row.content : fallbackPrompt;
  const data   = await openaiChat([{ role: 'user', content: prompt }], 400);
  return data.choices[0].message.content;
}

// POST /api/guided-meditation
app.post('/api/guided-meditation', auth, async (req, res) => {
  try {
    const response = await textCompletion(2, 'Guide the user through a short calming meditation.');
    res.json({ response });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed to generate meditation.' });
  }
});

// POST /api/breathing-exercise
app.post('/api/breathing-exercise', auth, async (req, res) => {
  try {
    const response = await textCompletion(3, 'Guide the user through a breathing exercise.');
    res.json({ response });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed to generate breathing exercise.' });
  }
});

// POST /api/positive-affirmation
app.post('/api/positive-affirmation', auth, async (req, res) => {
  try {
    const data = await openaiChat([{ role: 'user', content: 'Provide the user with a positive affirmation.' }], 200);
    res.json({ response: data.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed to generate affirmation.' });
  }
});

// POST /api/test-system-message
app.post('/api/test-system-message', auth, async (req, res) => {
  const systemMessage = req.body.system_message;
  if (!systemMessage) return res.json({ error: 'system_message is required.' });
  try {
    const data = await openaiChat([{ role: 'system', content: systemMessage }, { role: 'user', content: 'Hello' }], 300);
    res.json({ response: data.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed.' });
  }
});

// ── Questions & Answers ───────────────────────────────────────────────────────

// GET /api/questions (public)
app.get('/api/questions', (req, res) => {
  const questions = db.prepare('SELECT * FROM questions').all();
  const result = questions.map(q => {
    const row = { id: q.id, question: q.question, question_type: q.question_type };
    if (q.question_type === 1) {
      row.options = db.prepare('SELECT * FROM options WHERE question_id = ?').all(q.id);
    }
    return row;
  });
  res.json(result);
});

// GET /api/questionaire-completed
app.get('/api/questionaire-completed', auth, (req, res) => {
  res.json({ completed: req.user.questionaire_completed === 1 });
});

// POST /api/v1/answers
app.post('/api/v1/answers', auth, (req, res) => {
  const answers = req.body.answers;
  if (!Array.isArray(answers) || answers.length === 0)
    return res.status(422).json({ error: 'answers is required.' });

  const insert = db.prepare(
    'INSERT INTO answers (answer_type, content, question_id, user_id, option_id) VALUES (?, ?, ?, ?, ?)'
  );

  const saveAll = db.transaction(() => {
    for (const a of answers) {
      if (!a.question_id || !a.question_type) continue;
      if (a.question_type === 1) {
        insert.run(1, null, a.question_id, req.user.id, a.option_id || null);
      } else if (a.question_type === 2) {
        insert.run(2, a.content || null, a.question_id, req.user.id, null);
      }
    }
  });

  saveAll();
  db.prepare('UPDATE users SET questionaire_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);
  res.json({ success: true });
});

// ── TTS ───────────────────────────────────────────────────────────────────────

// Build a minimal RS256 JWT for Google service account auth
function buildGoogleJWT(credentials) {
  const now     = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: credentials.private_key_id })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss:   credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(credentials.private_key).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

async function getGoogleAccessToken(credentials) {
  const jwt  = buildGoogleJWT(credentials);
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
      res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => { try { resolve(JSON.parse(raw).access_token); } catch(e) { reject(e); } });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// POST /api/tts (public)
app.post('/api/tts', async (req, res) => {
  const input        = req.body.input;
  const voiceName    = req.body.voiceName || 'en-US-Standard-I';
  const ssml         = req.body.ssml || false;
  const outputFormat = req.body.output_format || 'MP3';
  const sampleRate   = req.body.sample_rate || 48000;
  const languageCode = req.body.language_code || 'en-US';

  if (!input) return res.status(422).json({ error: 'input is required.' });

  const credsJson = process.env.GOOGLE_TTS_CREDENTIALS;
  if (!credsJson) return res.status(503).json({ error: 'TTS credentials not configured.' });

  try {
    const credentials  = JSON.parse(credsJson);
    const accessToken  = await getGoogleAccessToken(credentials);
    const ttsBody = {
      input:       ssml ? { ssml: input } : { text: input },
      voice:       { languageCode, name: voiceName },
      audioConfig: { audioEncoding: outputFormat, sampleRateHertz: sampleRate },
    };
    const ttsData = await httpsPost(
      'texttospeech.googleapis.com',
      '/v1/text:synthesize',
      { 'Authorization': `Bearer ${accessToken}` },
      ttsBody
    );
    if (!ttsData.audioContent) return res.status(500).json({ error: 'TTS failed.', detail: ttsData });
    const audio = Buffer.from(ttsData.audioContent, 'base64');
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Disposition': 'inline; filename="audio.mp3"' });
    res.send(audio);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'TTS failed.' });
  }
});

// ── Web / SPA catch-all ───────────────────────────────────────────────────────

// Kept for backwards compat — POST /subscribe stores email to DB
const subscribeLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
app.post('/subscribe', subscribeLimiter, (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    try { db.prepare('INSERT INTO emails (email) VALUES (?)').run(email); } catch (_) {}
  }
  res.json({ success: true });
});

// Serve index.html for all non-API GET routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── (removed) old WELCOME_HTML / SUBSCRIBED_HTML pages ────────────────────────
const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PocketGuruAI: Mindfulness &amp; Meditation App | Coming Soon!</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <meta name="description" content="PocketGuruAI: Revolutionizing mental wellness with AI-driven guidance. Coming soon to App Store &amp; Google Play.">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="antialiased">
  <div class="relative overflow-hidden">
    <div class="bg-white pt-10 pb-14 sm:pt-16 lg:overflow-hidden lg:pt-24 lg:pb-24">
      <div class="mx-auto max-w-5xl lg:px-8">
        <div class="lg:grid lg:grid-cols-2 lg:gap-8">
          <div class="mx-auto max-w-md px-4 text-center sm:max-w-2xl sm:px-6 lg:flex lg:items-center lg:px-0 lg:text-left">
            <div class="lg:py-24">
              <h1 class="mt-4 text-4xl font-bold tracking-tight text-black sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                <span class="block text-pink-500">PocketGuruAI</span>
                <span class="block text-black">Coming Soon!</span>
              </h1>
              <p class="mt-3 text-base text-gray-400 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Experience Mindfulness and Meditation with PocketGuruAI - Join the Beta Waitlist!
              </p>
              <div class="mt-10 sm:mt-12">
                <form class="sm:mx-auto sm:max-w-xl lg:mx-0" action="/subscribe" method="post">
                  <div class="sm:flex">
                    <div class="min-w-0 flex-1">
                      <label for="email" class="sr-only">Email address</label>
                      <input id="email" name="email" type="email" placeholder="Enter your email"
                        class="block w-full rounded-md border-0 bg-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        required />
                    </div>
                    <div class="mt-3 sm:mt-0 sm:ml-3">
                      <button type="submit"
                        class="block w-full rounded-md bg-pink-500 py-3 px-4 font-medium text-white shadow hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-blue-300">
                        Join Waitlist
                      </button>
                    </div>
                  </div>
                </form>
                __ERROR__
              </div>
            </div>
          </div>
          <div class="mt-12 hidden lg:block">
            <img src="https://user-images.githubusercontent.com/1884712/202186141-9f8a93e1-7743-459a-bc95-b1d826931624.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <footer class="bg-white">
    <div class="mx-auto max-w-7xl overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <nav class="-mx-5 -my-2 flex flex-wrap justify-center">
        <div class="px-5 py-2"><a href="#" class="text-base text-gray-500 hover:text-gray-900">About</a></div>
        <div class="px-5 py-2"><a href="#" class="text-base text-gray-500 hover:text-gray-900">Press</a></div>
        <div class="px-5 py-2"><a href="#" class="text-base text-gray-500 hover:text-gray-900">Privacy</a></div>
      </nav>
      <div class="mt-8 flex justify-center space-x-6">
        <a href="https://instagram.com/pocketguruai" class="text-gray-400 hover:text-gray-500">
          <span class="sr-only">Instagram</span>
          <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
      </div>
    </div>
  </footer>
</body>
</html>`;

const SUBSCRIBED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PocketGuru | Success</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex justify-center items-center min-h-screen">
  <div class="container mx-auto">
    <div class="relative overflow-hidden">
      <div class="bg-white pt-10 pb-14 sm:pt-16 lg:overflow-hidden lg:pt-24 lg:pb-24">
        <div class="mx-auto max-w-5xl lg:px-8">
          <div class="mx-auto max-w-md px-4 text-center sm:max-w-2xl sm:px-6 lg:flex lg:items-center lg:px-0 lg:text-left">
            <div class="lg:py-24">
              <h1 class="mt-4 text-4xl font-bold tracking-tight text-black sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                <span class="block text-pink-500">You are now on the waitlist!</span>
              </h1>
              <p class="mt-3 text-base text-gray-400 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                You are enrolled to receive updates about PocketGuru AI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// GET /
app.get('/', (req, res) => {
  res.send(WELCOME_HTML.replace('__ERROR__', ''));
});

// POST /subscribe — rate limited to 3/min per IP
const subscribeLimiter = rateLimit({ windowMs: 60 * 1000, max: 3, standardHeaders: true, legacyHeaders: false });
app.post('/subscribe', subscribeLimiter, (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const html = WELCOME_HTML.replace('__ERROR__', '<p class="mt-4 text-red-700">Please enter a valid email address.</p>');
    return res.status(422).send(html);
  }
  try {
    db.prepare('INSERT INTO emails (email) VALUES (?)').run(email);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      // already subscribed — still redirect to success
    } else {
      console.error('Subscribe error:', err);
      const html = WELCOME_HTML.replace('__ERROR__', '<p class="mt-4 text-red-700">Something went wrong. Please try again.</p>');
      return res.status(500).send(html);
    }
  }
  res.redirect('/subscribed');
});

// GET /subscribed
app.get('/subscribed', (req, res) => res.send(SUBSCRIBED_HTML));

// GET /sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const base = process.env.APP_URL || `https://${req.hostname}`;
  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>`);
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PocketGuru listening on port ${PORT}`));
