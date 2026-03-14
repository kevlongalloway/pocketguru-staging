/* ═══════════════════════════════════════════════════════════
   POCKET GURU AI — Breathing Exercise Controller
   Manages breathing patterns, animations, and audio cues
   ═══════════════════════════════════════════════════════════ */

const BreathingController = (() => {

  // ─── Breathing Patterns ──────────────────────────────────
  const PATTERNS = {
    box: {
      name: 'Box Breathing',
      description: 'Inhale 4s · Hold 4s · Exhale 4s · Hold 4s',
      benefit: 'Reduces stress and improves focus',
      phases: [
        { type: 'in',   label: 'Breathe In',  duration: 4 },
        { type: 'hold', label: 'Hold',         duration: 4 },
        { type: 'out',  label: 'Breathe Out',  duration: 4 },
        { type: 'hold', label: 'Hold',         duration: 4 }
      ]
    },
    '478': {
      name: '4-7-8 Breathing',
      description: 'Inhale 4s · Hold 7s · Exhale 8s',
      benefit: 'Promotes deep sleep and anxiety relief',
      phases: [
        { type: 'in',   label: 'Breathe In',  duration: 4 },
        { type: 'hold', label: 'Hold',         duration: 7 },
        { type: 'out',  label: 'Breathe Out',  duration: 8 }
      ]
    },
    deep: {
      name: 'Deep Calm',
      description: 'Inhale 5s · Hold 2s · Exhale 7s',
      benefit: 'Activates the parasympathetic nervous system',
      phases: [
        { type: 'in',   label: 'Breathe In',  duration: 5 },
        { type: 'hold', label: 'Hold',         duration: 2 },
        { type: 'out',  label: 'Breathe Out',  duration: 7 }
      ]
    },
    energy: {
      name: 'Energize',
      description: 'Inhale 2s · Exhale 2s',
      benefit: 'Boosts energy and mental clarity',
      phases: [
        { type: 'in',  label: 'Breathe In',  duration: 2 },
        { type: 'out', label: 'Breathe Out', duration: 2 }
      ]
    }
  };

  // ─── State ───────────────────────────────────────────────
  let state = {
    running: false,
    currentPattern: 'box',
    currentPhaseIndex: 0,
    cycleCount: 0,
    cycleGoal: 5,
    countdownSeconds: 0,
    phaseTimer: null,
    countdownTimer: null
  };

  // ─── DOM Refs ────────────────────────────────────────────
  const els = {
    circle:     () => document.getElementById('breath-circle'),
    outerRing:  () => document.getElementById('breath-outer-ring'),
    midRing:    () => document.getElementById('breath-mid-ring'),
    label:      () => document.getElementById('breath-label'),
    timer:      () => document.getElementById('breath-timer'),
    cycleCount: () => document.getElementById('cycle-count'),
    startBtn:   () => document.getElementById('btn-start-breathing'),
    patternInfo:() => document.getElementById('pattern-info-box'),
    patternTitle:()=> document.getElementById('pattern-title'),
    patternDesc: ()=> document.getElementById('pattern-description'),
    patternBene: ()=> document.getElementById('pattern-benefit'),
    goalSelect:  ()=> document.getElementById('cycle-goal-select')
  };

  // ─── Initialise UI ───────────────────────────────────────
  const init = () => {
    // Pattern buttons
    document.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.addEventListener('click', () => selectPattern(btn.dataset.pattern));
    });

    // Start/stop button
    els.startBtn()?.addEventListener('click', toggleBreathing);

    // Goal selector
    els.goalSelect()?.addEventListener('change', (e) => {
      state.cycleGoal = parseInt(e.target.value, 10);
    });

    // Initial pattern display
    updatePatternInfo('box');
  };

  // ─── Pattern Selection ───────────────────────────────────
  const selectPattern = (patternKey) => {
    if (state.running) stop();
    state.currentPattern = patternKey;

    document.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pattern === patternKey);
    });

    updatePatternInfo(patternKey);
    resetVisual();
  };

  const updatePatternInfo = (key) => {
    const p = PATTERNS[key];
    if (!p) return;
    if (els.patternTitle())  els.patternTitle().textContent = p.name;
    if (els.patternDesc())   els.patternDesc().textContent = p.description;
    if (els.patternBene())   els.patternBene().textContent = p.benefit;
  };

  // ─── Start / Stop / Toggle ───────────────────────────────
  const toggleBreathing = async () => {
    if (state.running) {
      stop();
    } else {
      await start();
    }
  };

  const start = async () => {
    // Ensure audio is initialised
    AudioEngine.init();
    await AudioEngine.resume();

    state.running = true;
    state.currentPhaseIndex = 0;
    state.cycleCount = 0;

    const btn = els.startBtn();
    if (btn) {
      btn.textContent = 'Stop';
      btn.classList.add('btn-secondary');
      btn.classList.remove('btn-primary');
    }

    updateCycleDisplay();
    runPhase();
  };

  const stop = () => {
    state.running = false;
    clearTimeout(state.phaseTimer);
    clearInterval(state.countdownTimer);

    const btn = els.startBtn();
    if (btn) {
      btn.textContent = 'Start Breathing';
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-secondary');
    }

    resetVisual();
    AudioEngine.ambient.stop(2);
  };

  // ─── Phase Runner ────────────────────────────────────────
  const runPhase = () => {
    if (!state.running) return;

    const pattern = PATTERNS[state.currentPattern];
    const phase = pattern.phases[state.currentPhaseIndex];

    // Animate the circle
    animatePhase(phase);

    // Play audio cue
    AudioEngine.cues.playBreath(phase.type);

    // Start countdown
    state.countdownSeconds = phase.duration;
    updateTimerDisplay(state.countdownSeconds);

    clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(() => {
      state.countdownSeconds--;
      updateTimerDisplay(state.countdownSeconds);
      if (state.countdownSeconds <= 0) clearInterval(state.countdownTimer);
    }, 1000);

    // Schedule next phase
    state.phaseTimer = setTimeout(() => {
      if (!state.running) return;

      state.currentPhaseIndex++;

      // End of cycle
      if (state.currentPhaseIndex >= pattern.phases.length) {
        state.currentPhaseIndex = 0;
        state.cycleCount++;
        updateCycleDisplay();

        // Check goal completion
        if (state.cycleGoal > 0 && state.cycleCount >= state.cycleGoal) {
          onGoalReached();
          return;
        }
      }

      runPhase();
    }, phase.duration * 1000);
  };

  const onGoalReached = () => {
    AudioEngine.cues.playCompletion();
    stop();

    // Show completion message
    const label = els.label();
    const timer = els.timer();
    if (label) label.textContent = '✓ Done!';
    if (timer) timer.textContent = '';

    const circle = els.circle();
    if (circle) {
      circle.classList.remove('inhale', 'exhale', 'hold');
      circle.style.borderColor = 'rgba(52, 211, 153, 0.6)';
      circle.style.boxShadow = '0 0 60px rgba(52, 211, 153, 0.4)';
    }

    setTimeout(resetVisual, 3000);
  };

  // ─── Visual Animations ───────────────────────────────────
  const animatePhase = (phase) => {
    const circle = els.circle();
    const outerRing = els.outerRing();
    const midRing = els.midRing();
    const label = els.label();

    if (!circle) return;

    // Remove previous animation classes
    circle.classList.remove('inhale', 'exhale', 'hold');
    circle.style.removeProperty('animation');

    // Force reflow to restart animation
    void circle.offsetWidth;

    // Set CSS duration variable for the animation
    circle.style.setProperty('--breath-duration', `${phase.duration}s`);

    if (label) label.textContent = phase.label;

    switch (phase.type) {
      case 'in':
        circle.classList.add('inhale');
        circle.style.borderColor = 'rgba(14, 165, 233, 0.7)';
        circle.style.boxShadow = '0 0 60px rgba(14, 165, 233, 0.4)';
        if (outerRing) outerRing.style.transform = `scale(${1 + 0.3 * (phase.duration / 5)})`;
        if (midRing)   midRing.style.transform   = `scale(${1 + 0.2 * (phase.duration / 5)})`;
        break;

      case 'out':
        circle.classList.add('exhale');
        circle.style.borderColor = 'rgba(124, 58, 237, 0.5)';
        circle.style.boxShadow = '0 0 30px rgba(124, 58, 237, 0.2)';
        if (outerRing) outerRing.style.transform = 'scale(1)';
        if (midRing)   midRing.style.transform   = 'scale(1)';
        break;

      case 'hold':
        circle.classList.add('hold');
        circle.style.borderColor = 'rgba(52, 211, 153, 0.5)';
        circle.style.boxShadow = '0 0 30px rgba(52, 211, 153, 0.2)';
        break;
    }

    // Add smooth transitions to rings
    if (outerRing) outerRing.style.transition = `transform ${phase.duration}s ease-in-out`;
    if (midRing)   midRing.style.transition   = `transform ${phase.duration * 0.8}s ease-in-out`;
  };

  const resetVisual = () => {
    const circle = els.circle();
    const outerRing = els.outerRing();
    const midRing = els.midRing();
    const label = els.label();
    const timer = els.timer();

    if (circle) {
      circle.classList.remove('inhale', 'exhale', 'hold');
      circle.style.removeProperty('animation');
      circle.style.transform = 'scale(1)';
      circle.style.borderColor = 'rgba(14, 165, 233, 0.4)';
      circle.style.boxShadow = '0 0 40px rgba(14, 165, 233, 0.2)';
    }

    if (outerRing) { outerRing.style.transform = 'scale(1)'; outerRing.style.transition = 'none'; }
    if (midRing)   { midRing.style.transform   = 'scale(1)'; midRing.style.transition   = 'none'; }
    if (label) label.textContent = 'Ready';
    if (timer) timer.textContent = '';
  };

  const updateTimerDisplay = (secs) => {
    const timer = els.timer();
    if (timer) timer.textContent = secs > 0 ? secs : '';
  };

  const updateCycleDisplay = () => {
    const el = els.cycleCount();
    if (el) el.textContent = state.cycleCount;
  };

  // ─── External API ────────────────────────────────────────
  const startWithPattern = async (patternKey) => {
    selectPattern(patternKey || 'box');
    await start();
  };

  return {
    init,
    start,
    stop,
    toggle: toggleBreathing,
    startWithPattern,
    selectPattern,
    patterns: PATTERNS,
    getState: () => ({ ...state })
  };
})();
