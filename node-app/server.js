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

// OpenAI chat completions with Groq fallback
async function openaiChat(messages, maxTokens = 500) {
  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    const data = await httpsPost('api.openai.com', '/v1/chat/completions',
      { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      { model: 'gpt-3.5-turbo', messages, max_tokens: maxTokens }
    );
    if (data && data.choices) return data;
    console.warn('OpenAI error, falling back to Groq:', JSON.stringify(data));
  }
  // Fallback: Groq (free tier)
  if (!process.env.GROQ_API_KEY) throw new Error('OpenAI unavailable and GROQ_API_KEY is not set');
  const groqData = await httpsPost('api.groq.com', '/openai/v1/chat/completions',
    { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    { model: 'llama-3.1-8b-instant', messages, max_tokens: maxTokens }
  );
  if (!groqData || !groqData.choices) {
    console.error('Groq raw response:', JSON.stringify(groqData));
    throw new Error('No choices in Groq response');
  }
  return groqData;
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


// ── SPA catch-all ────────────────────────────────────────────────────────────

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PocketGuru listening on port ${PORT}`));
