/* ═══════════════════════════════════════════════════════════
   POCKET GURU AI — Main App Controller
   Handles routing, auth, state, and feature orchestration
   ═══════════════════════════════════════════════════════════ */

(async () => {

  // ─── View State ──────────────────────────────────────────
  const AppState = {
    currentMainView: 'home',      // within app-layout
    currentScreen: 'splash',      // splash | auth | onboarding | app
    audioEnabled: false,
    user: null,
    questions: [],
    currentQuestion: 0,
    questionAnswers: {},
    affirmationHistory: []
  };

  // ─── DOM Helpers ─────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const byId = (id) => document.getElementById(id);

  // ─── Toast ───────────────────────────────────────────────
  let toastTimeout;
  const showToast = (msg, duration = 3000) => {
    const toast = byId('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
  };

  // ─── Screen Navigation ───────────────────────────────────
  const showScreen = (screenId) => {
    const screens = ['view-splash', 'view-auth', 'view-onboarding'];
    screens.forEach(id => {
      const el = byId(id);
      if (el) {
        el.classList.remove('active');
        el.classList.remove('exit');
      }
    });

    const appLayout = byId('app-layout');
    if (appLayout) appLayout.classList.add('hidden');

    if (screenId === 'app') {
      appLayout?.classList.remove('hidden');
    } else {
      const target = byId(screenId);
      if (target) {
        requestAnimationFrame(() => target.classList.add('active'));
      }
    }
    AppState.currentScreen = screenId;
  };

  // ─── App View Navigation (within bottom nav) ─────────────
  const navigateTo = (viewId) => {
    $$('.app-view').forEach(v => v.classList.remove('active'));
    $$('.nav-btn').forEach(b => b.classList.remove('active'));

    const view = byId(`view-${viewId}`);
    if (view) view.classList.add('active');

    const navBtn = $(`[data-view="${viewId}"]`);
    if (navBtn) navBtn.classList.add('active');

    AppState.currentMainView = viewId;

    // Stop any active sessions when navigating away
    if (viewId !== 'meditation') {
      MeditationController.stopPlayback();
    }
    if (viewId !== 'breathing') {
      BreathingController.stop();
    }
  };

  // ─── Particle Background ─────────────────────────────────
  const initParticles = () => {
    const canvas = byId('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = (count = 80) => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        speedY: -(Math.random() * 0.15 + 0.05),
        speedX: (Math.random() - 0.5) * 0.06,
        opacity: Math.random() * 0.6 + 0.1,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.opacity += p.twinkleSpeed * p.twinkleDir;
        if (p.opacity >= 0.7 || p.opacity <= 0.05) p.twinkleDir *= -1;

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -2) { p.y = canvas.height + 2; p.x = Math.random() * canvas.width; }
        if (p.x < -2) p.x = canvas.width + 2;
        if (p.x > canvas.width + 2) p.x = -2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 180, 255, ${p.opacity})`;
        ctx.fill();
      });

      animFrame = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => { resize(); createParticles(); });

    // Toggle via settings
    return {
      stop: () => cancelAnimationFrame(animFrame),
      start: () => { draw(); }
    };
  };

  // ─── Authentication ───────────────────────────────────────
  const setupAuth = () => {
    // Tab switching
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.tab-btn').forEach(b => b.classList.remove('active'));
        $$('.auth-form').forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        const formId = `form-${btn.dataset.tab}`;
        byId(formId)?.classList.add('active');
      });
    });

    // Login form
    byId('form-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = byId('login-email')?.value.trim();
      const password = byId('login-password')?.value;
      const errEl = byId('login-error');

      if (!email || !password) {
        showFormError(errEl, 'Please fill in all fields.');
        return;
      }

      setFormLoading('btn-login', true);
      try {
        await API.auth.login(email, password);
        onLoginSuccess();
      } catch (err) {
        showFormError(errEl, err.message || 'Login failed. Please try again.');
      } finally {
        setFormLoading('btn-login', false);
      }
    });

    // Register form
    byId('form-register')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name     = byId('register-name')?.value.trim();
      const email    = byId('register-email')?.value.trim();
      const password = byId('register-password')?.value;
      const errEl    = byId('register-error');

      if (!name || !email || !password) {
        showFormError(errEl, 'Please fill in all fields.');
        return;
      }
      if (password.length < 8) {
        showFormError(errEl, 'Password must be at least 8 characters.');
        return;
      }

      setFormLoading('btn-register', true);
      try {
        await API.auth.register(name, email, password);
        onLoginSuccess(true);
      } catch (err) {
        showFormError(errEl, err.message || 'Registration failed. Please try again.');
      } finally {
        setFormLoading('btn-register', false);
      }
    });
  };

  const showFormError = (el, msg) => {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  };

  const setFormLoading = (btnId, loading) => {
    const btn = byId(btnId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = loading;
    if (text) text.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
  };

  const onLoginSuccess = async (isNew = false) => {
    AppState.user = API.getUser();
    updateUserDisplay();

    if (isNew) {
      // New user: show onboarding
      await loadQuestionnaire();
      showScreen('view-onboarding');
    } else {
      // Existing user: check if questionnaire done
      try {
        const result = await API.questionnaire.checkCompleted();
        if (result.completed) {
          enterApp();
        } else {
          await loadQuestionnaire();
          showScreen('view-onboarding');
        }
      } catch {
        enterApp();
      }
    }
  };

  const enterApp = () => {
    showScreen('app');
    promptAudioPermission();
    loadDailyAffirmation();
    updateGreeting();
  };

  const handleLogout = async () => {
    MeditationController.stopPlayback();
    BreathingController.stop();
    AudioEngine.ambient.stop(0);
    AudioEngine.voice.stop();
    await API.auth.logout();
    AppState.user = null;
    showScreen('view-auth');
    showToast('Signed out successfully');
  };

  // ─── User Display ─────────────────────────────────────────
  const updateUserDisplay = () => {
    const user = API.getUser();
    if (!user) return;
    const name = user.name || user.email?.split('@')[0] || 'Friend';

    const displayNameEl = byId('user-display-name');
    if (displayNameEl) displayNameEl.textContent = name;

    const settingsNameEl = byId('settings-user-name');
    if (settingsNameEl) settingsNameEl.textContent = name;

    const settingsEmailEl = byId('settings-user-email');
    if (settingsEmailEl) settingsEmailEl.textContent = user.email || '';
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    const el = byId('greeting-time');
    if (el) el.textContent = greeting;
  };

  // ─── Audio Permission ─────────────────────────────────────
  const promptAudioPermission = () => {
    const overlay = byId('audio-permission-overlay');
    if (!overlay) return;

    // Check if already granted
    if (localStorage.getItem('pg_audio_ok')) {
      initAudio();
      return;
    }

    overlay.classList.remove('hidden');

    byId('btn-enable-audio')?.addEventListener('click', () => {
      localStorage.setItem('pg_audio_ok', '1');
      overlay.classList.add('hidden');
      initAudio();
    }, { once: true });

    byId('btn-skip-audio')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
    }, { once: true });
  };

  const initAudio = () => {
    AudioEngine.init();
    AudioEngine.voice.loadVoices();
    AppState.audioEnabled = true;
  };

  // ─── Questionnaire / Onboarding ──────────────────────────
  const loadQuestionnaire = async () => {
    try {
      const data = await API.questionnaire.getQuestions();
      AppState.questions = Array.isArray(data) ? data : (data.data || data.questions || []);
    } catch {
      AppState.questions = getDefaultQuestions();
    }
    renderQuestion(0);
  };

  const getDefaultQuestions = () => [
    {
      id: 1,
      question: 'How are you feeling today?',
      answer_type: 1,
      options: [
        { id: 1, option: 'Calm and peaceful' },
        { id: 2, option: 'Stressed and overwhelmed' },
        { id: 3, option: 'Anxious or worried' },
        { id: 4, option: 'Tired and low energy' }
      ]
    },
    {
      id: 2,
      question: 'What brings you to Pocket Guru?',
      answer_type: 1,
      options: [
        { id: 5, option: 'Reduce stress and anxiety' },
        { id: 6, option: 'Improve sleep quality' },
        { id: 7, option: 'Build mindfulness habits' },
        { id: 8, option: 'Improve focus and clarity' }
      ]
    },
    {
      id: 3,
      question: 'How often would you like to practice?',
      answer_type: 1,
      options: [
        { id: 9, option: 'Daily' },
        { id: 10, option: 'A few times a week' },
        { id: 11, option: 'Once a week' },
        { id: 12, option: 'Whenever I need it' }
      ]
    },
    {
      id: 4,
      question: 'What\'s your experience with meditation?',
      answer_type: 1,
      options: [
        { id: 13, option: 'Complete beginner' },
        { id: 14, option: 'Some experience' },
        { id: 15, option: 'Regular practitioner' },
        { id: 16, option: 'Advanced' }
      ]
    },
    {
      id: 5,
      question: 'Tell us a bit about yourself (optional)',
      answer_type: 2
    }
  ];

  const renderQuestion = (index) => {
    const container = byId('question-container');
    if (!container || !AppState.questions.length) return;

    const q = AppState.questions[index];
    if (!q) return;

    const total = AppState.questions.length;
    const progress = ((index + 1) / total) * 100;

    // Update progress
    const fill = byId('onboarding-progress');
    if (fill) fill.style.width = `${progress}%`;

    const label = byId('progress-label');
    if (label) label.textContent = `${index + 1} of ${total}`;

    // Back button
    const prevBtn = byId('btn-prev-q');
    if (prevBtn) prevBtn.disabled = index === 0;

    // Next button text
    const nextBtn = byId('btn-next-q');
    if (nextBtn) nextBtn.innerHTML = index === total - 1
      ? `Finish <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9,18 15,12 9,6"/></svg>`
      : `Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9,18 15,12 9,6"/></svg>`;

    // Build question HTML
    const currentAnswer = AppState.questionAnswers[q.id];

    let optionsHtml = '';
    if (q.answer_type === 1 && q.options) {
      optionsHtml = `<div class="options-list">
        ${q.options.map(opt => `
          <button class="option-btn ${currentAnswer === opt.id ? 'selected' : ''}"
                  data-question="${q.id}" data-option="${opt.id}">
            ${opt.option || opt.text || opt}
          </button>
        `).join('')}
      </div>`;
    } else {
      optionsHtml = `<textarea
        class="open-answer-input"
        placeholder="Share your thoughts..."
        data-question="${q.id}"
        maxlength="500"
      >${currentAnswer || ''}</textarea>`;
    }

    container.innerHTML = `
      <div class="question-slide">
        <h3>${q.question || q.content}</h3>
        ${optionsHtml}
      </div>
    `;

    // Option button listeners
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        AppState.questionAnswers[btn.dataset.question] = parseInt(btn.dataset.option);
      });
    });

    // Open answer listener
    const textarea = container.querySelector('.open-answer-input');
    if (textarea) {
      textarea.addEventListener('input', () => {
        AppState.questionAnswers[textarea.dataset.question] = textarea.value;
      });
    }
  };

  const setupOnboarding = () => {
    byId('btn-prev-q')?.addEventListener('click', () => {
      if (AppState.currentQuestion > 0) {
        AppState.currentQuestion--;
        renderQuestion(AppState.currentQuestion);
      }
    });

    byId('btn-next-q')?.addEventListener('click', async () => {
      const total = AppState.questions.length;

      if (AppState.currentQuestion < total - 1) {
        AppState.currentQuestion++;
        renderQuestion(AppState.currentQuestion);
      } else {
        // Submit answers
        await submitOnboarding();
      }
    });

    byId('btn-skip-onboarding')?.addEventListener('click', () => {
      enterApp();
    });
  };

  const submitOnboarding = async () => {
    try {
      const answers = Object.entries(AppState.questionAnswers).map(([qId, answer]) => ({
        question_id: parseInt(qId),
        answer_type: typeof answer === 'number' ? 1 : 2,
        option_id: typeof answer === 'number' ? answer : null,
        content: typeof answer === 'string' ? answer : null
      }));

      await API.questionnaire.submitAnswers(answers);
    } catch (_) {
      // Non-critical, continue anyway
    }
    enterApp();
  };

  // ─── Daily Affirmation ───────────────────────────────────
  const FALLBACK_AFFIRMATIONS = [
    'I am enough, exactly as I am in this moment.',
    'I choose peace over worry and presence over fear.',
    'My mind is calm and my heart is open.',
    'I have the strength to handle whatever comes my way.',
    'I am worthy of love, rest, and joy.',
    'I release what I cannot control and embrace what I can.',
    'Every breath is a new beginning.',
    'I trust the process of life and my place within it.',
    'I am growing, healing, and becoming.',
    'Kindness and compassion begin within me.'
  ];

  const loadDailyAffirmation = async () => {
    let affirmation;

    // Use cached daily affirmation
    const cached = JSON.parse(localStorage.getItem('pg_daily_affirmation') || 'null');
    const today = new Date().toDateString();

    if (cached && cached.date === today) {
      affirmation = cached.text;
    } else {
      try {
        const data = await API.affirmation.get();
        affirmation = extractResponseText(data);
        localStorage.setItem('pg_daily_affirmation', JSON.stringify({ text: affirmation, date: today }));
      } catch {
        affirmation = FALLBACK_AFFIRMATIONS[new Date().getDate() % FALLBACK_AFFIRMATIONS.length];
      }
    }

    byId('home-affirmation-text').textContent = affirmation;
    byId('affirmation-text').textContent = affirmation;

    return affirmation;
  };

  const extractResponseText = (data) => {
    if (typeof data === 'string') return data.trim();
    const keys = ['response', 'affirmation', 'text', 'content', 'message', 'result'];
    for (const k of keys) {
      if (data[k] && typeof data[k] === 'string') return data[k].trim();
    }
    return String(data);
  };

  // ─── Affirmations Screen ──────────────────────────────────
  const setupAffirmations = () => {
    byId('btn-new-affirmation')?.addEventListener('click', async () => {
      const btn = byId('btn-new-affirmation');
      if (btn) btn.disabled = true;

      const textEl = byId('affirmation-text');
      if (textEl) textEl.style.opacity = '0.4';

      try {
        const data = await API.affirmation.get();
        const text = extractResponseText(data);

        // Save to history
        const prev = textEl?.textContent;
        if (prev && !prev.includes('Loading')) {
          AppState.affirmationHistory.unshift(prev);
          renderAffirmationHistory();
        }

        if (textEl) { textEl.textContent = text; textEl.style.opacity = '1'; }
        byId('home-affirmation-text').textContent = text;
      } catch {
        const idx = Math.floor(Math.random() * FALLBACK_AFFIRMATIONS.length);
        const text = FALLBACK_AFFIRMATIONS[idx];
        if (textEl) { textEl.textContent = text; textEl.style.opacity = '1'; }
      }

      if (btn) btn.disabled = false;
    });

    byId('btn-speak-affirmation')?.addEventListener('click', () => {
      const text = byId('affirmation-text')?.textContent;
      if (!text || AppState.audioEnabled === false) return;
      AudioEngine.init();
      AudioEngine.voice.speakAffirmation(text);
    });

    byId('btn-home-affirmation-play')?.addEventListener('click', () => {
      const text = byId('home-affirmation-text')?.textContent;
      if (!text) return;
      AudioEngine.init();
      AudioEngine.voice.speakAffirmation(text);
    });
  };

  const renderAffirmationHistory = () => {
    const container = byId('affirmation-history');
    if (!container) return;
    container.innerHTML = AppState.affirmationHistory.slice(0, 3).map(text =>
      `<div class="affirmation-history-item">"${text}"</div>`
    ).join('');
  };

  // ─── Chat ─────────────────────────────────────────────────
  const setupChat = () => {
    const input = byId('chat-input');
    const sendBtn = byId('btn-send-chat');
    const resetBtn = byId('btn-reset-chat');

    const sendMessage = async () => {
      const msg = input?.value.trim();
      if (!msg) return;

      if (input) input.value = '';
      autoResizeTextarea(input);

      appendChatMessage('user', msg);
      showTypingIndicator(true);

      try {
        const data = await API.chat.send(msg);
        const reply = extractResponseText(data);
        showTypingIndicator(false);
        appendChatMessage('assistant', reply);
      } catch (err) {
        showTypingIndicator(false);
        if (err.name === 'AuthError') {
          appendChatMessage('assistant', 'Please sign in to chat with Guru.');
        } else {
          appendChatMessage('assistant', 'I\'m having trouble connecting right now. Please try again in a moment.');
        }
      }
    };

    sendBtn?.addEventListener('click', sendMessage);

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    input?.addEventListener('input', () => autoResizeTextarea(input));

    resetBtn?.addEventListener('click', async () => {
      try {
        await API.chat.reset();
      } catch (_) {}
      const container = byId('chat-messages');
      if (container) {
        container.innerHTML = `
          <div class="chat-msg assistant">
            <div class="chat-bubble">
              Hello again! I'm Guru, your AI wellness companion. 🌿<br><br>
              What's on your mind today?
            </div>
            <span class="chat-time">Just now</span>
          </div>
        `;
      }
      showToast('Conversation reset');
    });
  };

  const appendChatMessage = (role, text) => {
    const container = byId('chat-messages');
    if (!container) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${role}`;
    msgEl.innerHTML = `
      <div class="chat-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      <span class="chat-time">${time}</span>
    `;

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  };

  const showTypingIndicator = (show) => {
    const el = byId('chat-typing');
    if (el) el.hidden = !show;
    if (show) {
      const container = byId('chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }
  };

  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  };

  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // ─── Settings ─────────────────────────────────────────────
  const setupSettings = () => {
    byId('btn-logout')?.addEventListener('click', handleLogout);
    byId('btn-open-settings')?.addEventListener('click', () => navigateTo('settings'));

    byId('setting-ambient')?.addEventListener('change', (e) => {
      AudioEngine.ambient.setEnabled(e.target.checked);
    });

    byId('setting-voice')?.addEventListener('change', (e) => {
      AudioEngine.voice.setEnabled(e.target.checked);
    });

    byId('setting-breath-cues')?.addEventListener('change', (e) => {
      AudioEngine.cues.setEnabled(e.target.checked);
    });

    byId('setting-particles')?.addEventListener('change', (e) => {
      const canvas = byId('bg-canvas');
      if (canvas) canvas.style.display = e.target.checked ? 'block' : 'none';
    });
  };

  // ─── Navigation Setup ─────────────────────────────────────
  const setupNavigation = () => {
    // Bottom nav
    $$('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.view));
    });

    // Feature card clicks
    $$('.feature-card[data-nav]').forEach(card => {
      card.addEventListener('click', () => navigateTo(card.dataset.nav));
    });

    // Quick start buttons
    $$('.quick-start-btn[data-nav]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const view = btn.dataset.nav;
        const pattern = btn.dataset.pattern;
        const type = btn.dataset.type;
        navigateTo(view);
        if (view === 'breathing' && pattern) {
          setTimeout(() => BreathingController.startWithPattern(pattern), 300);
        }
        if (view === 'meditation' && type) {
          setTimeout(() => {
            MeditationController.selectSessionType(type);
            MeditationController.generateScript();
          }, 300);
        }
      });
    });

    // Back buttons
    $$('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo('home'));
    });

    // Chat back — stop sounds
    $$('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioEngine.voice.stop();
      });
    });
  };

  // ─── PWA Service Worker ───────────────────────────────────
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' });
      } catch (e) {
        console.warn('SW registration failed:', e);
      }
    }
  };

  // ─── Install Prompt ───────────────────────────────────────
  let installPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    // Could show an "Add to Home Screen" button here
  });

  // ─── App Initialisation ───────────────────────────────────
  const boot = async () => {
    // Start particles
    initParticles();

    // Register service worker
    registerServiceWorker();

    // Set up all event handlers
    setupAuth();
    setupOnboarding();
    setupNavigation();
    setupAffirmations();
    setupChat();
    setupSettings();

    // Initialise feature controllers
    MeditationController.init();
    BreathingController.init();

    // Check auth status
    await new Promise(r => setTimeout(r, 1200)); // Show splash

    if (API.isAuthenticated()) {
      try {
        const { valid } = await API.auth.checkAuth();
        if (valid) {
          AppState.user = API.getUser();
          updateUserDisplay();
          updateGreeting();
          enterApp();
        } else {
          showScreen('view-auth');
        }
      } catch {
        showScreen('view-auth');
      }
    } else {
      showScreen('view-auth');
    }
  };

  // Start the app
  boot();

})();
