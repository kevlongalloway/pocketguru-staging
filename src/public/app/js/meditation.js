/* ═══════════════════════════════════════════════════════════
   POCKET GURU AI — Meditation Controller
   Manages AI-generated meditation sessions with TTS playback
   ═══════════════════════════════════════════════════════════ */

const MeditationController = (() => {

  // ─── Offline/Demo Fallback Scripts ───────────────────────
  const FALLBACK_SCRIPTS = {
    stress: `Welcome. Find a comfortable position and gently close your eyes.
Take a slow, deep breath in through your nose... and exhale slowly through your mouth.
With each breath, feel the tension beginning to release from your body.
Let your shoulders soften. Let your jaw unclench.
Notice any areas of tightness, and breathe warmth into each one.
You are safe. You are here. This moment is yours.
With every exhale, you release what no longer serves you.
Tension dissolves... stress melts away... you are becoming calm.
Stay here for as long as you need. You are peaceful. You are well.`,

    sleep: `Allow your body to sink gently into the surface beneath you.
Breathe in slowly... and breathe out all the thoughts of the day.
There is nothing to do right now. Nowhere to be.
Let your mind grow still, like a quiet lake at dusk.
Your eyelids grow heavy... your muscles release...
With each breath, you drift deeper into comfort and peace.
The day is done. You are safe. You are held.
Let sleep come to you like a soft, warm wave.
You drift... deeper... and deeper... into restful sleep.`,

    focus: `Sit comfortably and take three deep, cleansing breaths.
In... and out. In... and out. In... and out.
Now bring your awareness to the present moment.
Notice your breath... the rise and fall of your chest.
You are clear. You are focused. Your mind is sharp and ready.
Let distractions fade like clouds passing through the sky.
Your attention is a gift you give to this moment.
Feel clarity settling in your mind like clear, still water.
You are present. You are capable. You are focused.`,

    anxiety: `You are safe in this moment. Breathe.
Take a gentle breath in for four counts... one, two, three, four.
Hold softly for four... one, two, three, four.
Now breathe out slowly for six... one, two, three, four, five, six.
Feel your nervous system beginning to settle.
Your heart rate slows. Your thoughts quiet.
Anxiety is just energy moving through you — it will pass.
You have faced difficult moments before. You are stronger than you know.
Breathe... and trust yourself. You are okay. Right now, you are okay.`,

    gratitude: `Place one hand gently on your heart.
Take a slow breath and feel the warmth of your own presence.
Think of one small thing you are grateful for today.
It doesn't need to be grand — perhaps a warm cup of tea, a kind word, morning light.
Now breathe that gratitude into your heart.
Feel it expand with each breath... warmth spreading through your chest.
You are alive. You are present. There is beauty in this very moment.
Gratitude is a practice, and you are practicing now.
You are enough. You have enough. All is well.`
  };

  // ─── State ───────────────────────────────────────────────
  let state = {
    sessionType: 'stress',
    script: '',
    isGenerating: false,
    isPlaying: false,
    isPaused: false,
    words: [],
    currentWordIndex: 0,
    ambientSound: 'ocean'
  };

  // ─── DOM References ──────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const els = {
    orb:         () => $('meditation-orb'),
    text:        () => $('meditation-display-text'),
    generateBtn: () => $('btn-generate-meditation'),
    playBtn:     () => $('btn-play-meditation'),
    stopBtn:     () => $('btn-stop-meditation'),
    playIcon:    () => $('play-icon'),
    pauseIcon:   () => $('pause-icon'),
    voiceVol:    () => $('voice-volume'),
    ambientVol:  () => $('ambient-volume')
  };

  // ─── Initialise ──────────────────────────────────────────
  const init = () => {
    // Session type buttons
    document.querySelectorAll('.session-type-btn').forEach(btn => {
      btn.addEventListener('click', () => selectSessionType(btn.dataset.type));
    });

    // Ambient sound buttons
    document.querySelectorAll('.ambient-btn').forEach(btn => {
      btn.addEventListener('click', () => selectAmbient(btn.dataset.sound));
    });

    // Control buttons
    els.generateBtn()?.addEventListener('click', generateScript);
    els.playBtn()?.addEventListener('click', togglePlayback);
    els.stopBtn()?.addEventListener('click', stopPlayback);

    // Volume sliders
    els.voiceVol()?.addEventListener('input', (e) => {
      AudioEngine.voice.setVolume(e.target.value / 100);
    });

    els.ambientVol()?.addEventListener('input', (e) => {
      AudioEngine.ambient.setVolume(e.target.value / 100);
    });
  };

  // ─── Session Type ─────────────────────────────────────────
  const selectSessionType = (type) => {
    state.sessionType = type;
    document.querySelectorAll('.session-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    // Clear previous script when type changes
    if (state.script && !state.isPlaying) {
      state.script = '';
      const textEl = els.text();
      if (textEl) {
        textEl.innerHTML = 'Tap "Generate" to create a new meditation.';
      }
      setPlayEnabled(false);
    }
  };

  // ─── Ambient Sound ───────────────────────────────────────
  const selectAmbient = (sound) => {
    state.ambientSound = sound;
    document.querySelectorAll('.ambient-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sound === sound);
    });

    if (state.isPlaying || AudioEngine.ambient.isPlaying()) {
      AudioEngine.ambient.play(sound);
    }
  };

  // ─── Script Generation ───────────────────────────────────
  const generateScript = async () => {
    if (state.isGenerating) return;

    stopPlayback();
    state.isGenerating = true;

    const btn = els.generateBtn();
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="btn-spinner"></span>
        Generating...
      `;
    }

    const textEl = els.text();
    if (textEl) {
      textEl.innerHTML = '<em style="color:var(--text-muted)">Your AI meditation is being crafted...</em>';
    }

    try {
      const data = await API.meditation.get(state.sessionType);
      state.script = extractText(data);
    } catch (err) {
      // Use fallback script when offline or API unavailable
      state.script = FALLBACK_SCRIPTS[state.sessionType] || FALLBACK_SCRIPTS.stress;
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Generate
      `;
    }

    state.isGenerating = false;
    displayScript(state.script);
    setPlayEnabled(true);
  };

  // Extract text from API response (handles various formats)
  const extractText = (data) => {
    if (typeof data === 'string') return data;
    if (data.response) return data.response;
    if (data.meditation) return data.meditation;
    if (data.text) return data.text;
    if (data.content) return data.content;
    if (data.data) return extractText(data.data);
    return JSON.stringify(data);
  };

  // ─── Script Display ──────────────────────────────────────
  const displayScript = (script) => {
    const textEl = els.text();
    if (!textEl) return;

    // Split into words and wrap each in a span
    state.words = script.trim().split(/\s+/);
    state.currentWordIndex = 0;

    textEl.innerHTML = state.words
      .map((word, i) => `<span class="word" data-index="${i}">${word} </span>`)
      .join('');
  };

  const highlightWord = (wordIndex) => {
    const textEl = els.text();
    if (!textEl) return;

    // Remove previous highlights
    textEl.querySelectorAll('.word-spoken').forEach(el => {
      el.classList.remove('word-current');
    });

    textEl.querySelectorAll('.word').forEach((el, i) => {
      el.classList.remove('word-current', 'word-spoken');
      if (i < wordIndex) el.classList.add('word-spoken');
      if (i === wordIndex) {
        el.classList.add('word-current');
        // Scroll word into view
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    state.currentWordIndex = wordIndex;
  };

  // ─── Playback Controls ───────────────────────────────────
  const togglePlayback = async () => {
    if (!state.script) return;

    AudioEngine.init();
    await AudioEngine.resume();

    if (state.isPlaying && !state.isPaused) {
      pausePlayback();
    } else {
      playScript();
    }
  };

  const playScript = async () => {
    if (!state.script) return;

    state.isPlaying = true;
    state.isPaused = false;

    // Update UI
    updatePlayButton(true);
    setStopEnabled(true);

    // Start orb animation
    const orb = els.orb();
    if (orb) orb.classList.add('playing');

    // Start ambient sounds
    if (AudioEngine.settings.ambientEnabled && state.ambientSound !== 'none') {
      AudioEngine.ambient.play(state.ambientSound);
    }

    // Start speaking
    AudioEngine.voice.speakMeditation(state.script, {
      onWord: (charIndex, charLength) => {
        // Map character index back to word index
        const text = state.script;
        const textBefore = text.substring(0, charIndex);
        const wordIndex = textBefore.split(/\s+/).length - 1;
        highlightWord(Math.max(0, wordIndex));
      },
      onSentence: (index) => {
        // Brief ambient swell between sentences
      },
      onEnd: () => {
        onPlaybackComplete();
      },
      onError: (e) => {
        console.warn('TTS error:', e);
        onPlaybackComplete();
      }
    });
  };

  const pausePlayback = () => {
    state.isPaused = true;
    AudioEngine.voice.stop();
    updatePlayButton(false);

    const orb = els.orb();
    if (orb) orb.classList.remove('playing');
  };

  const stopPlayback = () => {
    state.isPlaying = false;
    state.isPaused = false;

    AudioEngine.voice.stop();
    AudioEngine.ambient.stop(2);

    updatePlayButton(false);
    setStopEnabled(false);

    const orb = els.orb();
    if (orb) orb.classList.remove('playing');

    // Reset word highlights
    const textEl = els.text();
    if (textEl) {
      textEl.querySelectorAll('.word').forEach(el => {
        el.classList.remove('word-current', 'word-spoken');
      });
    }
    state.currentWordIndex = 0;
  };

  const onPlaybackComplete = () => {
    state.isPlaying = false;
    state.isPaused = false;

    updatePlayButton(false);
    setStopEnabled(false);

    const orb = els.orb();
    if (orb) orb.classList.remove('playing');

    // Fade out ambient sound gently after completion
    setTimeout(() => AudioEngine.ambient.stop(3), 5000);

    // Show all words as spoken (completed)
    const textEl = els.text();
    if (textEl) {
      textEl.querySelectorAll('.word').forEach(el => {
        el.classList.add('word-spoken');
        el.classList.remove('word-current');
      });
    }
  };

  // ─── UI Helpers ──────────────────────────────────────────
  const updatePlayButton = (isPlaying) => {
    const playIcon = els.playIcon();
    const pauseIcon = els.pauseIcon();

    if (playIcon)  playIcon.classList.toggle('hidden', isPlaying);
    if (pauseIcon) pauseIcon.classList.toggle('hidden', !isPlaying);
  };

  const setPlayEnabled = (enabled) => {
    const btn = els.playBtn();
    if (btn) btn.disabled = !enabled;
  };

  const setStopEnabled = (enabled) => {
    const btn = els.stopBtn();
    if (btn) btn.disabled = !enabled;
  };

  // ─── Called from home quick-start ────────────────────────
  const startWithType = async (type) => {
    selectSessionType(type);
    await generateScript();
    await playScript();
  };

  return {
    init,
    generateScript,
    playScript,
    pausePlayback,
    stopPlayback,
    startWithType,
    selectSessionType,
    selectAmbient,
    getState: () => ({ ...state })
  };
})();
