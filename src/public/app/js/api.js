/* ═══════════════════════════════════════════════════════════
   POCKET GURU AI — API Client
   Handles all communication with the Laravel backend
   ═══════════════════════════════════════════════════════════ */

const API = (() => {
  const BASE_URL = '/api';

  // ─── Token Management ──────────────────────────────────
  const getToken = () => localStorage.getItem('pg_token');
  const setToken = (t) => localStorage.setItem('pg_token', t);
  const clearToken = () => localStorage.removeItem('pg_token');

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('pg_user') || 'null');
    } catch { return null; }
  };
  const setUser = (u) => localStorage.setItem('pg_user', JSON.stringify(u));
  const clearUser = () => localStorage.removeItem('pg_user');

  // ─── HTTP Helper ────────────────────────────────────────
  const request = async (method, endpoint, data = null, requiresAuth = true) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    if (requiresAuth) {
      const token = getToken();
      if (!token) throw new AuthError('No authentication token');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const opts = { method, headers };
    if (data && method !== 'GET') opts.body = JSON.stringify(data);

    const resp = await fetch(`${BASE_URL}${endpoint}`, opts);

    if (resp.status === 401) {
      clearToken();
      clearUser();
      throw new AuthError('Session expired. Please sign in again.');
    }

    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { message: text }; }

    if (!resp.ok) {
      const msg = json.message || json.error || `Error ${resp.status}`;
      throw new ApiError(msg, resp.status);
    }

    return json;
  };

  // ─── Auth Endpoints ─────────────────────────────────────
  const register = async (name, email, password) => {
    const data = await request('POST', '/register', { name, email, password }, false);
    if (data.token) { setToken(data.token); setUser(data.user || { name, email }); }
    return data;
  };

  const login = async (email, password) => {
    const data = await request('POST', '/login', { email, password }, false);
    if (data.token) { setToken(data.token); setUser(data.user || { email }); }
    return data;
  };

  const logout = async () => {
    const token = getToken();
    try {
      if (token) await fetch(`${BASE_URL}/logout/${token}`, { method: 'GET' });
    } catch (_) { /* ignore */ }
    clearToken();
    clearUser();
  };

  const checkAuth = async () => {
    try {
      const data = await request('GET', '/check-authentication');
      return { valid: true, user: data };
    } catch {
      return { valid: false };
    }
  };

  const getProfile = () => request('GET', '/user');

  // ─── Feature Endpoints ──────────────────────────────────
  const getMeditation = (type = 'stress') =>
    request('POST', '/guided-meditation', { type });

  const getAffirmation = () =>
    request('POST', '/positive-affirmation', {});

  const getBreathingExercise = (pattern = 'box') =>
    request('POST', '/breathing-exercise', { pattern });

  // ─── Chat Endpoints ─────────────────────────────────────
  const getChatHistory = () => request('GET', '/chat');

  const sendMessage = (message) =>
    request('POST', '/chat', { message });

  const resetChat = () => request('GET', '/reset-conversation');

  // ─── Questionnaire ──────────────────────────────────────
  const getQuestions = () => request('GET', '/questions', null, false);

  const submitAnswers = (answers) =>
    request('POST', '/v1/answers', { answers });

  const checkQuestionnaireCompleted = () =>
    request('GET', '/questionaire-completed');

  // ─── TTS Endpoint ───────────────────────────────────────
  const synthesizeSpeech = async (text) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${BASE_URL}/tts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: text,
        'en-US-Standard-I': 'en-US-Standard-I',
        language_code: 'en-US',
        output_format: 'MP3',
        sample_rate: 48000
      })
    });

    if (!resp.ok) throw new ApiError(`TTS failed: ${resp.status}`);
    return await resp.blob();
  };

  // ─── Error Classes ──────────────────────────────────────
  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  class AuthError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AuthError';
    }
  }

  // ─── Public API ─────────────────────────────────────────
  return {
    getToken, setToken, clearToken,
    getUser, setUser, clearUser,
    isAuthenticated: () => !!getToken(),

    auth: { register, login, logout, checkAuth, getProfile },
    meditation: { get: getMeditation },
    breathing: { get: getBreathingExercise },
    affirmation: { get: getAffirmation },
    chat: { getHistory: getChatHistory, send: sendMessage, reset: resetChat },
    questionnaire: { getQuestions, submitAnswers, checkCompleted: checkQuestionnaireCompleted },
    tts: { synthesize: synthesizeSpeech },

    ApiError, AuthError
  };
})();
