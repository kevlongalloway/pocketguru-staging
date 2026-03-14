/* ═══════════════════════════════════════════════════════════
   POCKET GURU AI — Audio Engine
   Procedural ambient sounds + TTS voice + breathing cues
   All sound generated in-browser via Web Audio API
   ═══════════════════════════════════════════════════════════ */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let ambientGain = null;
  let voiceGain = null;
  let cueGain = null;

  let currentAmbientNodes = [];
  let currentAmbientType = 'ocean';
  let isAmbientPlaying = false;
  let isMuted = false;

  const settings = {
    ambientVolume: 0.35,
    voiceVolume: 0.9,
    cueVolume: 0.6,
    ambientEnabled: true,
    voiceEnabled: true,
    cuesEnabled: true
  };

  // ─── Initialisation (must be called after user gesture) ─
  const init = () => {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });

      masterGain = ctx.createGain();
      ambientGain = ctx.createGain();
      voiceGain = ctx.createGain();
      cueGain = ctx.createGain();

      masterGain.connect(ctx.destination);
      ambientGain.connect(masterGain);
      voiceGain.connect(masterGain);
      cueGain.connect(masterGain);

      ambientGain.gain.value = settings.ambientVolume;
      voiceGain.gain.value = settings.voiceVolume;
      cueGain.gain.value = settings.cueVolume;

      return true;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
      return false;
    }
  };

  const resume = async () => {
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  };

  // ─── Noise Generators ────────────────────────────────────

  // Paul Kellet's pink noise algorithm
  const createPinkNoiseBuffer = (duration = 4) => {
    const sampleRate = ctx.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = ctx.createBuffer(2, frameCount, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < frameCount; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  };

  const createWhiteNoiseBuffer = (duration = 4) => {
    const sampleRate = ctx.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = ctx.createBuffer(2, frameCount, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < frameCount; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
    }
    return buffer;
  };

  const createBrownNoiseBuffer = (duration = 4) => {
    const sampleRate = ctx.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = ctx.createBuffer(2, frameCount, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < frameCount; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }
    return buffer;
  };

  // Create a looping buffer source
  const createLoopingNoise = (buffer, gainNode) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    return source;
  };

  // ─── Ambient Sound Builders ──────────────────────────────

  const buildOcean = () => {
    const nodes = [];
    const output = ctx.createGain();
    output.gain.value = 1;
    output.connect(ambientGain);

    // Base ocean: brown noise through lowpass
    const brownBuf = createBrownNoiseBuffer(8);
    const baseSource = createLoopingNoise(brownBuf, ctx.createGain());
    const baseLPF = ctx.createBiquadFilter();
    baseLPF.type = 'lowpass';
    baseLPF.frequency.value = 320;
    baseLPF.Q.value = 0.8;
    baseSource.connect(baseLPF);
    baseLPF.connect(output);
    nodes.push(baseSource);

    // Wave modulation: LFO on gain
    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.5;
    const pinkBuf = createPinkNoiseBuffer(6);
    const waveSource = createLoopingNoise(pinkBuf, ctx.createGain());
    const waveLPF = ctx.createBiquadFilter();
    waveLPF.type = 'bandpass';
    waveLPF.frequency.value = 600;
    waveLPF.Q.value = 1.2;
    waveSource.connect(waveLPF);
    waveLPF.connect(waveGain);
    waveGain.connect(output);
    nodes.push(waveSource);

    // Slow LFO to simulate wave rhythm (0.12 Hz ~ 8s cycle)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 0.35;
    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);
    nodes.push(lfo);

    // Second wave layer (slightly out of phase)
    const lfo2 = ctx.createOscillator();
    const lfo2Gain = ctx.createGain();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.08;
    lfo2Gain.gain.value = 0.2;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(output.gain);
    nodes.push(lfo2);

    return { nodes, output };
  };

  const buildRain = () => {
    const nodes = [];
    const output = ctx.createGain();
    output.gain.value = 1;
    output.connect(ambientGain);

    // White noise through bandpass for rain hiss
    const whiteBuf = createWhiteNoiseBuffer(4);
    const rainSource = createLoopingNoise(whiteBuf, ctx.createGain());
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1800;
    bpf.Q.value = 0.6;
    rainSource.connect(bpf);
    bpf.connect(output);
    nodes.push(rainSource);

    // Heavier drops: pink noise through HPF
    const pinkBuf = createPinkNoiseBuffer(6);
    const dropsSource = createLoopingNoise(pinkBuf, ctx.createGain());
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highshelf';
    hpf.frequency.value = 3000;
    hpf.gain.value = 3;
    const dropsGain = ctx.createGain();
    dropsGain.gain.value = 0.4;
    dropsSource.connect(hpf);
    hpf.connect(dropsGain);
    dropsGain.connect(output);
    nodes.push(dropsSource);

    // Subtle low rumble
    const brownBuf = createBrownNoiseBuffer(4);
    const rumbleSource = createLoopingNoise(brownBuf, ctx.createGain());
    const rumbleLPF = ctx.createBiquadFilter();
    rumbleLPF.type = 'lowpass';
    rumbleLPF.frequency.value = 180;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.3;
    rumbleSource.connect(rumbleLPF);
    rumbleLPF.connect(rumbleGain);
    rumbleGain.connect(output);
    nodes.push(rumbleSource);

    return { nodes, output };
  };

  const buildForest = () => {
    const nodes = [];
    const output = ctx.createGain();
    output.gain.value = 1;
    output.connect(ambientGain);

    // Gentle breeze: pink noise through LPF
    const pinkBuf = createPinkNoiseBuffer(8);
    const breezeSource = createLoopingNoise(pinkBuf, ctx.createGain());
    const breezeLPF = ctx.createBiquadFilter();
    breezeLPF.type = 'lowpass';
    breezeLPF.frequency.value = 800;
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.5;
    breezeSource.connect(breezeLPF);
    breezeLPF.connect(breezeGain);
    breezeGain.connect(output);
    nodes.push(breezeSource);

    // Wind sway: LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain);
    lfoGain.connect(breezeGain.gain);
    nodes.push(lfo);

    // Soft chirp tones (bird-like harmonics using oscillators)
    const chirpFreqs = [1200, 1600, 2000, 1400];
    chirpFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(oscGain);
      oscGain.connect(output);
      // Very quiet, intermittent
      const chirpLFO = ctx.createOscillator();
      const chirpLFOGain = ctx.createGain();
      chirpLFO.frequency.value = 0.04 + i * 0.015;
      chirpLFOGain.gain.value = 0.02;
      oscGain.gain.value = 0;
      chirpLFO.connect(chirpLFOGain);
      chirpLFOGain.connect(oscGain.gain);
      nodes.push(osc, chirpLFO);
    });

    return { nodes, output };
  };

  const buildSpace = () => {
    const nodes = [];
    const output = ctx.createGain();
    output.gain.value = 1;
    output.connect(ambientGain);

    // Deep drone: multiple detuned sine waves
    const droneFreqs = [40, 60, 80, 120];
    droneFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq + (Math.random() - 0.5) * 2;
      oscGain.gain.value = 0.08 - i * 0.015;
      osc.connect(oscGain);
      oscGain.connect(output);
      nodes.push(osc);
    });

    // Binaural-like modulation
    const modOsc = ctx.createOscillator();
    const modGain = ctx.createGain();
    modOsc.frequency.value = 0.03; // ~30s cycle
    modGain.gain.value = 0.04;
    modOsc.connect(modGain);
    modGain.connect(output.gain);
    nodes.push(modOsc);

    // Ethereal shimmer: very quiet high freq with slow tremolo
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.value = 528; // Solfeggio frequency
    shimmerGain.gain.value = 0.03;
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(output);

    const tremLFO = ctx.createOscillator();
    const tremGain = ctx.createGain();
    tremLFO.frequency.value = 0.15;
    tremGain.gain.value = 0.025;
    tremLFO.connect(tremGain);
    tremGain.connect(shimmerGain.gain);
    nodes.push(shimmerOsc, tremLFO);

    return { nodes, output };
  };

  // ─── Ambient Playback ────────────────────────────────────

  const stopAmbient = (fadeTime = 1.5) => {
    if (!ctx || !currentAmbientNodes.length) return;
    const now = ctx.currentTime;
    try {
      ambientGain.gain.setTargetAtTime(0, now, fadeTime / 4);
      setTimeout(() => {
        currentAmbientNodes.forEach(n => {
          try { n.stop(); } catch (_) {}
          try { n.disconnect(); } catch (_) {}
        });
        currentAmbientNodes = [];
        if (isAmbientPlaying) ambientGain.gain.value = settings.ambientVolume;
        isAmbientPlaying = false;
      }, fadeTime * 1000);
    } catch (e) {
      currentAmbientNodes = [];
    }
  };

  const playAmbient = async (type = 'ocean') => {
    if (!init()) return;
    await resume();

    if (!settings.ambientEnabled) return;
    if (type === 'none') { stopAmbient(); return; }

    stopAmbient(0.8);

    setTimeout(() => {
      if (!ctx) return;
      currentAmbientType = type;

      let result;
      switch (type) {
        case 'rain':   result = buildRain();   break;
        case 'forest': result = buildForest(); break;
        case 'space':  result = buildSpace();  break;
        default:       result = buildOcean();  break;
      }

      const { nodes } = result;
      currentAmbientNodes = nodes;

      // Fade in
      ambientGain.gain.setValueAtTime(0, ctx.currentTime);
      ambientGain.gain.setTargetAtTime(settings.ambientVolume, ctx.currentTime, 1.5);

      nodes.forEach(n => {
        try { n.start(ctx.currentTime); } catch (_) {}
      });

      isAmbientPlaying = true;
    }, type === currentAmbientType ? 100 : 900);
  };

  const setAmbientVolume = (vol) => {
    settings.ambientVolume = Math.max(0, Math.min(1, vol));
    if (ambientGain && isAmbientPlaying) {
      ambientGain.gain.setTargetAtTime(settings.ambientVolume, ctx.currentTime, 0.3);
    }
  };

  // ─── Breathing Audio Cues ────────────────────────────────

  // Plays a soft, tuned bell tone for breath phase transitions
  const playBreathCue = (phase = 'in') => {
    if (!init() || !settings.cuesEnabled) return;
    resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(cueGain);

    // Phase-specific tones (healing solfeggio frequencies)
    const config = {
      in:   { freq: 396, attack: 0.02, decay: 1.2, harmonics: [1, 2, 3] },
      hold: { freq: 285, attack: 0.02, decay: 0.6, harmonics: [1, 2] },
      out:  { freq: 174, attack: 0.02, decay: 1.8, harmonics: [1, 1.5, 2] }
    };

    const c = config[phase] || config.in;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(c.freq, now);
    // Gentle pitch glide for softness
    osc.frequency.exponentialRampToValueAtTime(c.freq * 0.98, now + c.decay);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.45, now + c.attack);
    gainNode.gain.setTargetAtTime(0, now + c.attack, c.decay / 3);

    osc.start(now);
    osc.stop(now + c.decay + 0.5);

    // Add subtle harmonic overtone
    if (c.harmonics.length > 1) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = c.freq * (c.harmonics[1] || 2);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.12, now + c.attack);
      gain2.gain.setTargetAtTime(0, now + c.attack, c.decay / 4);
      osc2.connect(gain2);
      gain2.connect(cueGain);
      osc2.start(now);
      osc2.stop(now + c.decay + 0.2);
    }
  };

  // Play countdown tick sound
  const playTick = () => {
    if (!ctx || !settings.cuesEnabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = 'sine';
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(cueGain);
    osc.start(now);
    osc.stop(now + 0.1);
  };

  // Completion chime (3-note ascending)
  const playCompletionChime = () => {
    if (!ctx || !settings.cuesEnabled) return;
    const notes = [528, 659, 784];
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.35;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.5, now + 0.02);
      g.gain.setTargetAtTime(0, now + 0.02, 0.5);
      osc.connect(g);
      g.connect(cueGain);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  };

  // ─── Voice / TTS ─────────────────────────────────────────

  const speechSynth = window.speechSynthesis;
  let currentUtterance = null;
  let voicesLoaded = false;

  // Get the best available calming voice
  const getBestVoice = () => {
    const voices = speechSynth.getVoices();
    if (!voices.length) return null;

    // Priority order: known calm, natural voices
    const preferred = [
      'Samantha', 'Karen', 'Moira', 'Fiona', 'Victoria',     // macOS/iOS
      'Google US English', 'Google UK English Female',          // Chrome
      'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira',    // Windows
    ];

    for (const name of preferred) {
      const v = voices.find(v => v.name.includes(name));
      if (v) return v;
    }

    // Fallback: any English female-ish voice
    const enVoice = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    return enVoice || voices.find(v => v.lang.startsWith('en')) || voices[0];
  };

  const loadVoices = () => {
    return new Promise(resolve => {
      const voices = speechSynth.getVoices();
      if (voices.length) { voicesLoaded = true; resolve(voices); return; }
      const onVoicesChanged = () => {
        voicesLoaded = true;
        resolve(speechSynth.getVoices());
        speechSynth.removeEventListener('voiceschanged', onVoicesChanged);
      };
      speechSynth.addEventListener('voiceschanged', onVoicesChanged);
      // Timeout fallback
      setTimeout(() => { resolve(speechSynth.getVoices()); }, 2000);
    });
  };

  // Split text into speakable sentences with natural pauses
  const splitIntoSentences = (text) => {
    return text
      .replace(/\n\n+/g, '... ')
      .replace(/\n/g, '... ')
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
  };

  // Speak full meditation text, sentence by sentence
  const speakMeditation = async (text, { onWord, onSentence, onEnd, onError } = {}) => {
    if (!settings.voiceEnabled) {
      onEnd && onEnd();
      return;
    }

    stopSpeech();
    await loadVoices();

    // Try backend TTS first for higher quality
    try {
      const blob = await API.tts.synthesize(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = settings.voiceVolume;
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url);
        onEnd && onEnd();
      });
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        // Fall back to Web Speech API
        _webSpeechSpeak(text, { onWord, onSentence, onEnd, onError });
      });
      currentUtterance = audio;
      audio.play();
      return;
    } catch (e) {
      // Backend TTS not available, use Web Speech API
    }

    _webSpeechSpeak(text, { onWord, onSentence, onEnd, onError });
  };

  const _webSpeechSpeak = (text, { onWord, onSentence, onEnd, onError } = {}) => {
    const sentences = splitIntoSentences(text);
    let sentenceIndex = 0;

    const speakNext = () => {
      if (sentenceIndex >= sentences.length) {
        onEnd && onEnd();
        return;
      }

      const sentence = sentences[sentenceIndex];
      const utterance = new SpeechSynthesisUtterance(sentence);

      utterance.voice = getBestVoice();
      utterance.rate = 0.78;   // Slow, meditative pace
      utterance.pitch = 0.88;  // Slightly lower pitch for calmness
      utterance.volume = settings.voiceVolume;

      utterance.onboundary = (e) => {
        if (e.name === 'word') onWord && onWord(e.charIndex, e.charLength);
      };

      utterance.onend = () => {
        onSentence && onSentence(sentenceIndex);
        sentenceIndex++;
        // Natural pause between sentences (400-800ms)
        const pause = 400 + Math.random() * 400;
        setTimeout(speakNext, pause);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          onError && onError(e);
        }
      };

      currentUtterance = utterance;
      speechSynth.speak(utterance);
    };

    speakNext();
  };

  const speakAffirmation = (text, onEnd) => {
    if (!settings.voiceEnabled) { onEnd && onEnd(); return; }
    stopSpeech();
    _webSpeechSpeak(text, { onEnd });
  };

  const stopSpeech = () => {
    speechSynth.cancel();
    if (currentUtterance && currentUtterance instanceof Audio) {
      currentUtterance.pause();
      currentUtterance.currentTime = 0;
    }
    currentUtterance = null;
  };

  const isSpeaking = () => speechSynth.speaking;

  // ─── Volume Controls ─────────────────────────────────────

  const setVoiceVolume = (vol) => {
    settings.voiceVolume = Math.max(0, Math.min(1, vol));
    if (currentUtterance instanceof Audio) {
      currentUtterance.volume = settings.voiceVolume;
    }
  };

  const setCueVolume = (vol) => {
    settings.cueVolume = Math.max(0, Math.min(1, vol));
    if (cueGain) cueGain.gain.setTargetAtTime(settings.cueVolume, ctx.currentTime, 0.1);
  };

  const setAmbientEnabled = (enabled) => {
    settings.ambientEnabled = enabled;
    if (!enabled) stopAmbient();
  };

  const setVoiceEnabled = (enabled) => {
    settings.voiceEnabled = enabled;
    if (!enabled) stopSpeech();
  };

  const setCuesEnabled = (enabled) => {
    settings.cuesEnabled = enabled;
  };

  // ─── Cleanup ─────────────────────────────────────────────

  const destroy = () => {
    stopAmbient(0);
    stopSpeech();
    if (ctx) { ctx.close(); ctx = null; }
  };

  // ─── Public API ──────────────────────────────────────────
  return {
    init, resume,
    ambient: {
      play: playAmbient,
      stop: stopAmbient,
      setVolume: setAmbientVolume,
      setEnabled: setAmbientEnabled,
      isPlaying: () => isAmbientPlaying
    },
    cues: {
      playBreath: playBreathCue,
      playTick,
      playCompletion: playCompletionChime,
      setEnabled: setCuesEnabled
    },
    voice: {
      speakMeditation,
      speakAffirmation,
      stop: stopSpeech,
      isSpeaking,
      setVolume: setVoiceVolume,
      setEnabled: setVoiceEnabled,
      getBestVoice,
      loadVoices
    },
    settings,
    destroy,
    get ready() { return !!ctx; }
  };
})();
