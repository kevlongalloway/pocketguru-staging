'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const S = {
  token:    localStorage.getItem('pg_token'),
  user:     null,
  screen:   'home',
  chat:     [],
  medText:  null,
  affText:  null,
  questions: [],
  qAnswers:  {},
  qStep:     0,
  breathingActive: false,
  breathingPhaseIdx: 0,
  breathingTimer: null,
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`,
  meditate: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z"/></svg>`,
  breathe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>`,
};

// ── API ───────────────────────────────────────────────────────────────────────
async function api(method, path, body, skipAuth) {
  const headers = { 'Content-Type': 'application/json' };
  if (!skipAuth && S.token) headers['Authorization'] = `Bearer ${S.token}`;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.headers.get('content-type')?.includes('application/json')) return res.json();
  return res;
}
const POST = (p, b, s) => api('POST', p, b, s);
const GET  = (p, s)    => api('GET',  p, undefined, s);

async function playTTS(text, btnId) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`; }
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text, voiceName: 'en-US-Standard-I', language_code: 'en-US' }),
    });
    if (!res.ok) throw new Error('unavailable');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = ICONS.play + ' Playing…';
      audio.onended = () => { btn.innerHTML = ICONS.play + ' Play Audio'; URL.revokeObjectURL(url); };
    }
  } catch {
    if (btn) { btn.disabled = false; btn.innerHTML = '🔇 Audio unavailable'; }
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
function go(screen) {
  // Stop breathing if navigating away
  if (screen !== 'breathe') stopBreathing();
  S.screen = screen;
  render();
}

function render() {
  const app = document.getElementById('app');
  if (!S.token) { app.innerHTML = authHTML(); return; }
  app.innerHTML = `
    <div class="app-shell">
      <header class="header">
        <h1>🧘 PocketGuru</h1>
        <button onclick="doLogout()">${ICONS.logout} Logout</button>
      </header>
      <div class="screen" id="screen-content">${screenHTML()}</div>
      ${navHTML()}
    </div>`;
  afterRender();
}

function screenHTML() {
  switch (S.screen) {
    case 'home':      return homeHTML();
    case 'chat':      return chatHTML();
    case 'meditate':  return meditateHTML();
    case 'breathe':   return breatheHTML();
    case 'affirm':    return affirmHTML();
    case 'questionnaire': return questionnaireHTML();
    default:          return homeHTML();
  }
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function navHTML() {
  const items = [
    { id: 'home',    icon: ICONS.home,    label: 'Home' },
    { id: 'chat',    icon: ICONS.chat,    label: 'Chat' },
    { id: 'meditate',icon: ICONS.meditate,label: 'Meditate' },
    { id: 'breathe', icon: ICONS.breathe, label: 'Breathe' },
    { id: 'affirm',  icon: ICONS.star,    label: 'Affirm' },
  ];
  return `<nav class="bottom-nav">${items.map(i => `
    <button class="nav-item ${S.screen === i.id ? 'active' : ''}" onclick="go('${i.id}')">
      ${i.icon}<span>${i.label}</span>
    </button>`).join('')}
  </nav>`;
}

// ── Auth screen ───────────────────────────────────────────────────────────────
let authTab = 'login';
function authHTML() {
  return `<div class="auth-screen">
    <div class="auth-logo">🧘 PocketGuru</div>
    <p class="auth-tagline">Your AI mindfulness companion</p>
    <div class="auth-tabs">
      <button class="auth-tab ${authTab==='login'?'active':''}" onclick="switchTab('login')">Sign In</button>
      <button class="auth-tab ${authTab==='register'?'active':''}" onclick="switchTab('register')">Register</button>
    </div>
    <div class="form-card">
      ${authTab === 'login' ? `
        <div class="form-group"><label>Email</label><input id="a-email" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <div class="form-group"><label>Password</label><input id="a-pass" type="password" placeholder="••••••••" autocomplete="current-password"></div>
        <button class="btn btn-primary" onclick="doLogin()">Sign In</button>
      ` : `
        <div class="form-group"><label>Name</label><input id="a-name" type="text" placeholder="Your name" autocomplete="name"></div>
        <div class="form-group"><label>Email</label><input id="a-email" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <div class="form-group"><label>Password</label><input id="a-pass" type="password" placeholder="Min. 8 characters" autocomplete="new-password"></div>
        <button class="btn btn-primary" onclick="doRegister()">Create Account</button>
      `}
      <div id="auth-error"></div>
    </div>
  </div>`;
}

function switchTab(tab) { authTab = tab; document.getElementById('app').innerHTML = authHTML(); }

async function doLogin() {
  const email = document.getElementById('a-email').value.trim();
  const pass  = document.getElementById('a-pass').value;
  setAuthError('');
  const btn = document.querySelector('.btn-primary');
  btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`;
  const data = await POST('/api/login', { email, password: pass }, true);
  if (data.access_token) { S.token = data.access_token; localStorage.setItem('pg_token', S.token); await loadUser(); render(); }
  else { setAuthError(data.error || 'Login failed.'); btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function doRegister() {
  const name  = document.getElementById('a-name').value.trim();
  const email = document.getElementById('a-email').value.trim();
  const pass  = document.getElementById('a-pass').value;
  setAuthError('');
  const btn = document.querySelector('.btn-primary');
  btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`;
  const data = await POST('/api/register', { name, email, password: pass }, true);
  if (data.access_token) { S.token = data.access_token; localStorage.setItem('pg_token', S.token); await loadUser(); await checkQuestionnaire(); render(); }
  else { setAuthError(data.error || 'Registration failed.'); btn.disabled = false; btn.textContent = 'Create Account'; }
}

function setAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) el.innerHTML = msg ? `<div class="error-msg">${msg}</div>` : '';
}

async function doLogout() {
  if (S.token) await fetch(`/api/logout/${encodeURIComponent(S.token)}`).catch(() => {});
  S.token = null; S.user = null; localStorage.removeItem('pg_token');
  document.getElementById('app').innerHTML = authHTML();
}

// ── Home ──────────────────────────────────────────────────────────────────────
function homeHTML() {
  const name = S.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const tips = [
    'Take a deep breath. You've got this.',
    'Even 5 minutes of mindfulness can shift your day.',
    'Pause. Breathe. Be present.',
    'Your mind is a garden — tend it gently.',
    'Peace begins with a single breath.',
  ];
  const tip = tips[new Date().getDate() % tips.length];
  return `
    <div class="greeting">
      <h2>${greet}, ${name}! 👋</h2>
      <p>${tip}</p>
    </div>
    <div class="card-grid">
      <button class="feature-card" onclick="go('chat')">
        <div class="icon" style="background:#fce7f3">💬</div>
        <h3>AI Chat</h3>
        <p>Talk to your wellness guide</p>
      </button>
      <button class="feature-card" onclick="go('meditate')">
        <div class="icon" style="background:#f3e8ff">🧘</div>
        <h3>Meditate</h3>
        <p>AI-guided meditation</p>
      </button>
      <button class="feature-card" onclick="go('breathe')">
        <div class="icon" style="background:#e0f2fe">🌬️</div>
        <h3>Breathe</h3>
        <p>Breathing exercises</p>
      </button>
      <button class="feature-card" onclick="go('affirm')">
        <div class="icon" style="background:#fef9c3">✨</div>
        <h3>Affirm</h3>
        <p>Daily affirmations</p>
      </button>
    </div>
    <div class="card" style="background:linear-gradient(135deg,#fce7f3,#f3e8ff);border:none">
      <p style="font-size:.8rem;font-weight:700;color:#db2777;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Quick tip</p>
      <p style="font-size:.95rem;color:#4b5563;line-height:1.6">Try box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 times to reset your nervous system.</p>
    </div>`;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function chatHTML() {
  const msgs = S.chat.filter(m => m.role !== 'system').map(m => `
    <div class="msg ${m.role === 'user' ? 'user' : 'ai'}">
      <div class="msg-bubble">${escHtml(m.content)}</div>
    </div>`).join('');
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h2 style="font-size:1.2rem;font-weight:800">AI Chat</h2>
      <button class="btn btn-ghost" style="width:auto;padding:8px 14px;font-size:.8rem" onclick="resetChat()">Clear</button>
    </div>
    <div class="chat-messages" id="chat-msgs">${msgs || `<div class="msg ai"><div class="msg-bubble">Hi! I'm PocketGuru, your AI wellness companion. How are you feeling today? 🌸</div></div>`}</div>
    <div class="chat-input-bar">
      <input id="chat-in" type="text" placeholder="Share what's on your mind…" onkeydown="if(event.key==='Enter')sendChat()">
      <button class="chat-send" id="chat-send" onclick="sendChat()">${ICONS.send}</button>
    </div>`;
}

async function sendChat() {
  const input = document.getElementById('chat-in');
  const msg   = input?.value.trim();
  if (!msg) return;
  input.value = '';
  const send = document.getElementById('chat-send');
  if (send) send.disabled = true;

  S.chat.push({ role: 'user', content: msg });
  const msgs = document.getElementById('chat-msgs');
  if (msgs) {
    msgs.innerHTML += `<div class="msg user"><div class="msg-bubble">${escHtml(msg)}</div></div>
      <div class="msg ai" id="typing-indicator"><div class="msg-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }

  const data = await POST('/api/chat', { message: msg });
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();

  if (data?.response) {
    S.chat.push({ role: 'assistant', content: data.response });
    if (msgs) {
      msgs.innerHTML += `<div class="msg ai"><div class="msg-bubble">${escHtml(data.response)}</div></div>`;
      msgs.scrollTop = msgs.scrollHeight;
    }
  }
  if (send) send.disabled = false;
  input?.focus();
}

async function resetChat() {
  await GET('/api/reset-conversation');
  S.chat = [];
  document.getElementById('screen-content').innerHTML = chatHTML();
}

// ── Meditation ────────────────────────────────────────────────────────────────
function meditateHTML() {
  return `
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:16px">🧘 Guided Meditation</h2>
    ${S.medText ? `
      <div class="content-card">${escHtml(S.medText)}</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" id="play-med" onclick="playTTS(S.medText,'play-med')" style="flex:1">${ICONS.play} Play Audio</button>
        <button class="btn btn-ghost" onclick="generateMeditation()" style="flex:1">${ICONS.refresh} New</button>
      </div>
    ` : `
      <div class="card" style="text-align:center;padding:40px 24px">
        <div style="font-size:3rem;margin-bottom:16px">🧘</div>
        <p style="color:var(--muted);margin-bottom:24px">Generate a personalized guided meditation using AI</p>
        <button class="btn btn-primary" id="gen-med-btn" onclick="generateMeditation()">Generate Meditation</button>
      </div>
    `}`;
}

async function generateMeditation() {
  const btn = document.getElementById('gen-med-btn') || document.querySelector('.btn-ghost');
  if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div> Generating…`; }
  const data = await POST('/api/guided-meditation');
  if (data?.response) { S.medText = data.response; document.getElementById('screen-content').innerHTML = meditateHTML(); }
  else { if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; } }
}

// ── Breathing ─────────────────────────────────────────────────────────────────
const PHASES = [
  { name: 'Inhale',    secs: 4, cls: 'grow',       color: '#f9a8d4' },
  { name: 'Hold',      secs: 4, cls: 'hold-big',   color: '#e879f9' },
  { name: 'Exhale',    secs: 4, cls: 'shrink',     color: '#a78bfa' },
  { name: 'Hold',      secs: 4, cls: 'hold-small', color: '#818cf8' },
];

function breatheHTML() {
  return `
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:8px;text-align:center">🌬️ Box Breathing</h2>
    <p style="text-align:center;color:var(--muted);font-size:.85rem;margin-bottom:24px">4-4-4-4 — inhale, hold, exhale, hold</p>
    <div class="breathing-center">
      <div class="breathing-ring" id="b-ring">
        <div class="breathing-phase" id="b-phase">${S.breathingActive ? PHASES[S.breathingPhaseIdx].name : 'Ready'}</div>
        <div class="breathing-count" id="b-count">${S.breathingActive ? '' : '4'}</div>
      </div>
      <div style="text-align:center">
        <p class="breathing-label" id="b-label">${S.breathingActive ? 'Breathe with the circle' : 'Press start to begin'}</p>
        <p class="breathing-sub">Box breathing calms your nervous system</p>
      </div>
      <button class="btn ${S.breathingActive ? 'btn-outline' : 'btn-primary'}" style="width:160px" onclick="${S.breathingActive ? 'stopBreathing()' : 'startBreathing()'}">
        ${S.breathingActive ? '⏹ Stop' : '▶ Start'}
      </button>
    </div>`;
}

function startBreathing() {
  S.breathingActive = true;
  S.breathingPhaseIdx = 0;
  document.getElementById('screen-content').innerHTML = breatheHTML();
  runBreathPhase(0, PHASES[0].secs);
}

function runBreathPhase(phaseIdx, secsLeft) {
  if (!S.breathingActive) return;
  const ring  = document.getElementById('b-ring');
  const phase = document.getElementById('b-phase');
  const count = document.getElementById('b-count');
  const label = document.getElementById('b-label');
  if (!ring) { S.breathingActive = false; return; }

  const p = PHASES[phaseIdx];

  if (secsLeft === p.secs) {
    // New phase starting
    ring.className = `breathing-ring ${p.cls}`;
    if (phase) phase.textContent = p.name;
    if (label) label.textContent = 'Breathe with the circle';
    S.breathingPhaseIdx = phaseIdx;
  }

  if (count) count.textContent = secsLeft;

  if (secsLeft > 0) {
    S.breathingTimer = setTimeout(() => runBreathPhase(phaseIdx, secsLeft - 1), 1000);
  } else {
    const next = (phaseIdx + 1) % PHASES.length;
    S.breathingTimer = setTimeout(() => runBreathPhase(next, PHASES[next].secs), 100);
  }
}

function stopBreathing() {
  S.breathingActive = false;
  if (S.breathingTimer) clearTimeout(S.breathingTimer);
  document.getElementById('screen-content').innerHTML = breatheHTML();
}

// ── Affirmation ───────────────────────────────────────────────────────────────
function affirmHTML() {
  return `
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:16px;text-align:center">✨ Daily Affirmation</h2>
    ${S.affText ? `
      <div class="affirmation-card">"${escHtml(S.affText)}"</div>
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <button class="btn btn-primary" id="play-aff" onclick="playTTS(S.affText,'play-aff')" style="flex:1">${ICONS.play} Listen</button>
        <button class="btn btn-ghost" onclick="shareAffirmation()" style="flex:1">${ICONS.share} Share</button>
      </div>
      <button class="btn btn-outline" onclick="getAffirmation()">${ICONS.refresh} New Affirmation</button>
    ` : `
      <div class="card" style="text-align:center;padding:40px 24px">
        <div style="font-size:3rem;margin-bottom:16px">✨</div>
        <p style="color:var(--muted);margin-bottom:24px">Get your personalized daily affirmation</p>
        <button class="btn btn-primary" id="gen-aff-btn" onclick="getAffirmation()">Get Affirmation</button>
      </div>
    `}`;
}

async function getAffirmation() {
  const btn = document.getElementById('gen-aff-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div> Generating…`; }
  const data = await POST('/api/positive-affirmation');
  if (data?.response) { S.affText = data.response; document.getElementById('screen-content').innerHTML = affirmHTML(); }
  else { if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; } }
}

function shareAffirmation() {
  if (!S.affText) return;
  if (navigator.share) {
    navigator.share({ title: 'PocketGuruAI', text: `"${S.affText}" — PocketGuruAI` }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(S.affText).then(() => alert('Copied to clipboard!')).catch(() => {});
  }
}

// ── Questionnaire ─────────────────────────────────────────────────────────────
function questionnaireHTML() {
  if (!S.questions.length) return homeHTML();
  const q   = S.questions[S.qStep];
  const pct = Math.round(((S.qStep) / S.questions.length) * 100);
  return `
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Let's get to know you</h2>
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:16px">Question ${S.qStep + 1} of ${S.questions.length}</p>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="card">
      <p style="font-size:1.05rem;font-weight:700;margin-bottom:16px">${escHtml(q.question)}</p>
      ${q.question_type === 1 ? `
        <div id="options">${q.options.map(o => `
          <button class="option-btn ${S.qAnswers[q.id]?.option_id === o.id ? 'selected' : ''}"
            onclick="selectOption(${q.id}, ${o.id})">${escHtml(o.option)}</button>`).join('')}
        </div>
      ` : `
        <textarea id="open-ans" class="form-group" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:12px;font-family:inherit;font-size:1rem;resize:vertical;min-height:100px;outline:none"
          placeholder="Type your answer…">${S.qAnswers[q.id]?.content || ''}</textarea>
      `}
    </div>
    <div style="display:flex;gap:10px;margin-top:8px">
      ${S.qStep > 0 ? `<button class="btn btn-outline" onclick="qBack()" style="flex:1">Back</button>` : ''}
      <button class="btn btn-primary" onclick="qNext()" style="flex:1" id="q-next-btn">
        ${S.qStep < S.questions.length - 1 ? 'Next' : 'Finish'}
      </button>
    </div>`;
}

function selectOption(qId, optId) {
  S.qAnswers[qId] = { question_id: qId, question_type: 1, option_id: optId };
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
}

function qBack() { S.qStep--; document.getElementById('screen-content').innerHTML = questionnaireHTML(); }

async function qNext() {
  const q = S.questions[S.qStep];
  if (q.question_type === 2) {
    const val = document.getElementById('open-ans')?.value.trim();
    if (val) S.qAnswers[q.id] = { question_id: q.id, question_type: 2, content: val };
  }
  if (S.qStep < S.questions.length - 1) {
    S.qStep++;
    document.getElementById('screen-content').innerHTML = questionnaireHTML();
  } else {
    const btn = document.getElementById('q-next-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`; }
    const answers = Object.values(S.qAnswers);
    await POST('/api/v1/answers', { answers });
    S.screen = 'home';
    render();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\n/g, '<br>');
}

async function loadUser() {
  const data = await GET('/api/user');
  if (data?.id) S.user = data;
}

async function checkQuestionnaire() {
  const qs = await GET('/api/questions', true);
  if (Array.isArray(qs) && qs.length > 0) {
    const done = await GET('/api/questionaire-completed');
    if (!done?.completed) { S.questions = qs; S.qStep = 0; S.qAnswers = {}; S.screen = 'questionnaire'; }
  }
}

function afterRender() {
  // Scroll chat to bottom
  if (S.screen === 'chat') {
    const msgs = document.getElementById('chat-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }
  // Resume breathing animation if active (re-render case)
  if (S.screen === 'breathe' && S.breathingActive) {
    const p = PHASES[S.breathingPhaseIdx];
    runBreathPhase(S.breathingPhaseIdx, p.secs);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  if (S.token) {
    await loadUser();
    if (!S.user) { S.token = null; localStorage.removeItem('pg_token'); }
    else await checkQuestionnaire();
  }

  render();
}

init();
