/**
 * Procedural Sound Effects & Haptic Engine for KanbanDuo
 * Uses standard Web Audio API oscillators - 0 external files, 0 database storage.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Gentle futuristic harmonic chime (587Hz -> 880Hz)
 * Used for new tasks and task assignments
 */
export function playChimeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);

    triggerHapticPulse('light');
  } catch {
    // Audio contexts might be blocked before user interaction; fail silently
  }
}

/**
 * Ascending triumphant pulse (C5 -> E5 -> G5)
 * Used when tasks are completed
 */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.23);
    });

    triggerHapticPulse('success');
  } catch {
    // Fail silently
  }
}

/**
 * Low resonance alert pulse (440Hz -> 330Hz)
 * Used for urgent, overdue, or stagnant alerts
 */
export function playAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);

    triggerHapticPulse('warning');
  } catch {
    // Fail silently
  }
}

/**
 * Trigger subtle haptic feedback vibration on mobile devices
 */
export function triggerHapticPulse(type: 'light' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'light') {
      navigator.vibrate(25);
    } else if (type === 'success') {
      navigator.vibrate([30, 40, 40]);
    } else if (type === 'warning') {
      navigator.vibrate([40, 50, 40, 50, 40]);
    }
  } catch {
    // Ignore unsupported devices
  }
}

/**
 * Focus Mode Start: Low resonant initiation chime (330Hz -> 523Hz)
 */
export function playFocusStartSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, now); // E4
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.25); // C5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);

    triggerHapticPulse('light');
  } catch {
    // Fail silently
  }
}

/**
 * Focus Mode Complete: Sci-Fi Harmonic Zen chime (triple bell resonance)
 */
export function playFocusCompleteSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bells = [523.25, 659.25, 1046.5]; // C5, E5, C6

    bells.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.75);
    });

    triggerHapticPulse('success');
  } catch {
    // Fail silently
  }
}

/* ========================================================
   COMMAND CENTER — SCI-FI SPACESHIP AUDIO ENGINE
   ======================================================== */

const SOUND_ENABLED_KEY = 'kanban_sound_enabled';
const SOUND_LANG_KEY = 'kanban_sound_lang';
const CC_WELCOMED_KEY = 'kanban_cc_welcomed_session';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(SOUND_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  if (!enabled) {
    stopAmbientWarpDrone();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }
}

export function getSoundLanguage(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es';
  const val = localStorage.getItem(SOUND_LANG_KEY);
  if (val === 'es' || val === 'en') return val;
  const navLang = navigator.language?.toLowerCase() || 'es';
  return navLang.startsWith('es') ? 'es' : 'en';
}

export function setSoundLanguage(lang: 'es' | 'en'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_LANG_KEY, lang);
}

export function hasWelcomedThisSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(CC_WELCOMED_KEY) === 'true';
}

export function markWelcomedThisSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CC_WELCOMED_KEY, 'true');
}

/**
 * Secuencia de encendido y arranque de nave espacial (Boot Sequence)
 * Incluye zumbido de reactores + doble chime de intercomunicador de cabina
 */
export function playSciFiBootSequence() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Pulso sub-grave de encendido de reactores (50Hz -> 160Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(50, now);
    subOsc.frequency.exponentialRampToValueAtTime(160, now + 0.45);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.exponentialRampToValueAtTime(0.06, now + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.58);

    // 2. Tono de intercomunicador espacial de cabina (G5 784Hz -> C6 1046Hz)
    const intercomTimes = [now + 0.22, now + 0.38];
    const intercomFreqs = [783.99, 1046.5];

    intercomFreqs.forEach((freq, i) => {
      const t = intercomTimes[i];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.48);
    });

    triggerHapticPulse('light');
  } catch {}
}

/* ========================================================
   COMUNICACIONES DE PUENTE & INTELIGENCIA ARTIFICIAL DE ABORDO
   (VOZ ROBOTIZADA + ECO MULTI-TAP DE PUENTE DE NAVE)
   ======================================================== */

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Chime arpegiado con reverberación y eco espacial multi-tap de mamparos metálicos
 * Simula el sonido expandiéndose y rebotando en el puente de mando de una nave estelar
 */
export function playSpaceshipEchoChime() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Tono principal de intercomunicador (D5 587.33Hz -> A5 880Hz)
    const tones = [
      { freq: 587.33, time: now },
      { freq: 880.00, time: now + 0.09 },
    ];

    tones.forEach(({ freq, time }) => {
      // Onda directa
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.05, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.35);

      // Eco 1: Rebote en mamparo lateral (+85ms, amortiguado)
      const echo1Osc = ctx.createOscillator();
      const echo1Gain = ctx.createGain();
      const echo1Filter = ctx.createBiquadFilter();
      echo1Filter.type = 'lowpass';
      echo1Filter.frequency.setValueAtTime(700, time);

      echo1Osc.type = 'sine';
      echo1Osc.frequency.setValueAtTime(freq, time + 0.085);
      echo1Gain.gain.setValueAtTime(0.0001, time + 0.085);
      echo1Gain.gain.exponentialRampToValueAtTime(0.022, time + 0.095);
      echo1Gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

      echo1Osc.connect(echo1Filter);
      echo1Filter.connect(echo1Gain);
      echo1Gain.connect(ctx.destination);
      echo1Osc.start(time + 0.085);
      echo1Osc.stop(time + 0.45);

      // Eco 2: Rebote lejano de la bahía de mando (+180ms, más grave)
      const echo2Osc = ctx.createOscillator();
      const echo2Gain = ctx.createGain();
      const echo2Filter = ctx.createBiquadFilter();
      echo2Filter.type = 'lowpass';
      echo2Filter.frequency.setValueAtTime(450, time);

      echo2Osc.type = 'sine';
      echo2Osc.frequency.setValueAtTime(freq, time + 0.18);
      echo2Gain.gain.setValueAtTime(0.0001, time + 0.18);
      echo2Gain.gain.exponentialRampToValueAtTime(0.012, time + 0.195);
      echo2Gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);

      echo2Osc.connect(echo2Filter);
      echo2Filter.connect(echo2Gain);
      echo2Gain.connect(ctx.destination);
      echo2Osc.start(time + 0.18);
      echo2Osc.stop(time + 0.58);
    });

    // 2. Resonancia sub-grave de presurización de la sala (36Hz, 1.2s de cola acústica)
    const roomSub = ctx.createOscillator();
    const roomGain = ctx.createGain();
    roomSub.type = 'sine';
    roomSub.frequency.setValueAtTime(36, now);
    roomGain.gain.setValueAtTime(0.001, now);
    roomGain.gain.exponentialRampToValueAtTime(0.028, now + 0.04);
    roomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    roomSub.connect(roomGain);
    roomGain.connect(ctx.destination);
    roomSub.start(now);
    roomSub.stop(now + 1.25);
  } catch {}
}

/**
 * Acuse de recibo de canal cerrado (Roger Beep) con eco espacial en descenso
 */
export function playSpaceshipEchoRoger() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const tones = [
      { freq: 880.00, time: now },
      { freq: 1174.66, time: now + 0.055 },
    ];

    tones.forEach(({ freq, time }) => {
      // Onda directa
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.035, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.15);

      // Eco de mamparo (+95ms)
      const echoOsc = ctx.createOscillator();
      const echoGain = ctx.createGain();
      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(freq, time + 0.095);

      echoGain.gain.setValueAtTime(0.0001, time + 0.095);
      echoGain.gain.exponentialRampToValueAtTime(0.014, time + 0.105);
      echoGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

      echoOsc.connect(echoGain);
      echoGain.connect(ctx.destination);
      echoOsc.start(time + 0.095);
      echoOsc.stop(time + 0.3);
    });
  } catch {}
}

let activeServo: { osc: OscillatorNode; gain: GainNode } | null = null;
let servoSafetyTimer: NodeJS.Timeout | null = null;

function startServoRumble(ctx: AudioContext) {
  if (activeServo) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(58, now); // 58Hz sub-grave de servo mecánico (CERO pitos)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.014, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    activeServo = { osc, gain };

    // Temporizador de seguridad de 8s para garantizar que nunca quede sonando
    if (servoSafetyTimer) clearTimeout(servoSafetyTimer);
    servoSafetyTimer = setTimeout(() => {
      stopServoRumble();
    }, 8000);
  } catch {}
}

function stopServoRumble() {
  if (servoSafetyTimer) {
    clearTimeout(servoSafetyTimer);
    servoSafetyTimer = null;
  }
  if (!activeServo) return;
  try {
    const { osc, gain } = activeServo;
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {}
      }, 250);
    }
    activeServo = null;
  } catch {
    activeServo = null;
  }
}

/**
 * Saludo protocolario por voz de la Inteligencia Artificial de a bordo
 * Configurado con voz profundamente robotizada, metálica y eco acústico de puente de nave
 */
export function playShipWelcomeVoice(userName: string, customLang?: 'es' | 'en') {
  if (!isSoundEnabled()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    stopServoRumble();
    activeUtterance = null;

    const lang = customLang || getSoundLanguage();
    const firstName = userName ? userName.trim().split(' ')[0] : (lang === 'es' ? 'Comandante' : 'Commander');

    // Guión estructurado con sintaxis puramente de máquina militar
    const text =
      lang === 'es'
        ? `INICIANDO PROTOCOLO. Identificación biométrica... confirmada. Núcleo orbital... en línea. Comandante ${firstName}... Inteligencia Artificial... a su servicio.`
        : `PROTOCOL INITIATED. Biometric authorization... confirmed. Orbital core... online. Commander ${firstName}... Artificial Intelligence... standing by.`;

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance; // Retener referencia para evitar recolección de basura de Chromium
    utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';
    utterance.pitch = 0.65; // Tonalidad baja, fría, sintética y puramente metalizada
    utterance.rate = 0.84;  // Cadencia lenta, analítica y mecánica
    utterance.volume = 0.98;

    // Disparar chime de intercomunicador con eco espacial multi-tap
    playSpaceshipEchoChime();

    // Priorización de voces robóticas / sintéticas en el sistema operativo (EXCLUYENDO voces neurales humanas)
    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const langCode = lang === 'es' ? 'es' : 'en';
      const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));

      if (langVoices.length > 0) {
        // Excluir voces "naturales" o "neurales" que suenan a persona humana
        const nonNeuralVoices = langVoices.filter((v) => {
          const n = v.name.toLowerCase();
          return !n.includes('natural') && !n.includes('neural') && !n.includes('online');
        });

        const pool = nonNeuralVoices.length > 0 ? nonNeuralVoices : langVoices;

        const preferredVoice =
          pool.find((v) => {
            const n = v.name.toLowerCase();
            return (
              n.includes('david') ||
              n.includes('raul') ||
              n.includes('pablo') ||
              n.includes('mark') ||
              n.includes('george') ||
              n.includes('sabina') ||
              n.includes('helena') ||
              n.includes('zira') ||
              n.includes('google')
            );
          }) || pool[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
    };

    selectBestVoice();

    utterance.onstart = () => {
      const ctx = getAudioContext();
      if (ctx) startServoRumble(ctx);
    };

    // Al finalizar la voz: apagar servo y emitir blip de canal cerrado con eco
    utterance.onend = () => {
      stopServoRumble();
      activeUtterance = null;
      playSpaceshipEchoRoger();
    };

    utterance.onerror = () => {
      stopServoRumble();
      activeUtterance = null;
    };

    // Retardo de 260ms para permitir que el eco inicial resuene antes de la primera palabra
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        stopServoRumble();
        activeUtterance = null;
      }
    }, 260);
  } catch {}
}

/* ========================================================
   ATMÓSFERA AMBIENTAL DE NAVE (WARP CORE & CABIN HUM - CERO INTERFERENCIAS, CERO PITOS)
   ======================================================== */

interface AmbientDroneInstance {
  sub1: OscillatorNode;
  sub2: OscillatorNode;
  noiseSource: AudioBufferSourceNode;
  lfo: OscillatorNode;
  gain: GainNode;
  ctx: AudioContext;
}

let activeDrone: AmbientDroneInstance | null = null;
let cachedBrownianBuffer: AudioBuffer | null = null;

function getBrownianBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedBrownianBuffer) return cachedBrownianBuffer;
  const durationSeconds = 4;
  const bufferSize = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.0;
  }
  cachedBrownianBuffer = buffer;
  return buffer;
}

/**
 * Inicia la atmósfera espacial continua de la nave (Warp Core & Pressurized Cabin)
 * 100% Sub-grave puro + Ruido Browniano ultra-filtrado a 50Hz
 * CERO pitos, CERO frecuencias medias agudas, CERO distorsión. Puro calor sub-acústico de cabina.
 */
export function startAmbientWarpDrone() {
  if (!isSoundEnabled() || activeDrone) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Fundamental sub-grave ultra-cálido (40.0 Hz) - CERO frecuencias agudas ni pitos
    const sub1 = ctx.createOscillator();
    sub1.type = 'sine';
    sub1.frequency.setValueAtTime(40.0, now);

    // 2. Segundo armónico sub-grave tenue (80.0 Hz) a muy bajo volumen
    const sub2 = ctx.createOscillator();
    sub2.type = 'sine';
    sub2.frequency.setValueAtTime(80.0, now);
    const sub2Gain = ctx.createGain();
    sub2Gain.gain.setValueAtTime(0.12, now);
    sub2.connect(sub2Gain);

    // 3. Flujo de aire continuo presurizado ultra-grave (Ruido Browniano filtrado estrictamente a 50 Hz)
    // Nada por encima de 50 Hz puede pasar: CERO siseos, CERO silbidos
    const brownBuffer = getBrownianBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = brownBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(50, now);
    noiseFilter.Q.setValueAtTime(0.28, now); // ultra-amortiguado sin resonancia

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.20, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // 4. LFO de respiración cósmica ultra-lento (0.05 Hz = 1 ciclo cada 20 segundos)
    // Modula exclusivamente la ganancia global en ±8%, NUNCA frecuencias de filtros
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.05, now);
    lfoGain.gain.setValueAtTime(0.002, now);

    // 5. Ganancia maestra del ambiente con fade-in suave de 2.5s
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.022, now + 2.5);

    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    // Conectar todos los componentes al masterGain
    sub1.connect(masterGain);
    sub2Gain.connect(masterGain);
    noiseGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    sub1.start(now);
    sub2.start(now);
    noiseSource.start(now);
    lfo.start(now);

    activeDrone = {
      sub1,
      sub2,
      noiseSource,
      lfo,
      gain: masterGain,
      ctx,
    };
  } catch {}
}

/**
 * Detiene el zumbido ambiental con fade-out suave
 */
export function stopAmbientWarpDrone() {
  if (!activeDrone) return;
  try {
    const { sub1, sub2, noiseSource, lfo, gain, ctx } = activeDrone;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    setTimeout(() => {
      try {
        sub1.stop();
        sub2.stop();
        noiseSource.stop();
        lfo.stop();
        sub1.disconnect();
        sub2.disconnect();
        noiseSource.disconnect();
        lfo.disconnect();
        gain.disconnect();
      } catch {}
    }, 1300);

    activeDrone = null;
  } catch {
    activeDrone = null;
  }
}

/**
 * Escáner Holográfico de Telemetría Orbital al posarse sobre un mini-planeta
 * Sonido multi-capa de nave espacial:
 * 1. Chirp láser de fijación de objetivo (Target Lock de 18ms)
 * 2. Resonancia de plasma cristalino (doble tono armónico quinta perfecta, 130ms)
 * 3. Impulso gravitacional de masa planetaria (sub-pulse táctil de 40ms)
 */
export function playPlanetTelemetrySound(planetId: string) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Frecuencias base de plasma orbital para cada módulo táctico
    const tacticalFrequencies: Record<string, number> = {
      board: 659.25,      // E5 (Tablero / Tactical Grid)
      dashboard: 783.99,  // G5 (Métricas / Telemetry Array)
      calendar: 587.33,   // D5 (Calendario / Chrono Grid)
      pomodoro: 523.25,   // C5 (Pomodoro / Chrono Core)
      habits: 698.46,     // F5 (Hábitos / Bio Matrix)
      challenges: 880.00, // A5 (Retos / Orbital Beacon)
      goals: 987.77,      // B5 (Objetivos / Quantum Vector)
    };

    const f0 = tacticalFrequencies[planetId] || 700;
    const fHarmonic = f0 * 1.5; // Quinta perfecta armónica espacial

    // --- CAPA 1: Chirp táctico de fijación de sensor (Micro-laser sweep de 18ms) ---
    const chirpOsc = ctx.createOscillator();
    const chirpGain = ctx.createGain();
    chirpOsc.type = 'sine';
    chirpOsc.frequency.setValueAtTime(2200, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(900, now + 0.018);

    chirpGain.gain.setValueAtTime(0.001, now);
    chirpGain.gain.exponentialRampToValueAtTime(0.035, now + 0.004);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(ctx.destination);
    chirpOsc.start(now);
    chirpOsc.stop(now + 0.025);

    // --- CAPA 2: Resonancia de Plasma Cristalino (Doble tono armónico de 130ms) ---
    const oscMain = ctx.createOscillator();
    const oscHarm = ctx.createOscillator();
    const gainResonance = ctx.createGain();

    oscMain.type = 'sine';
    oscMain.frequency.setValueAtTime(f0, now + 0.004);

    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(fHarmonic, now + 0.004);

    gainResonance.gain.setValueAtTime(0.001, now + 0.004);
    gainResonance.gain.exponentialRampToValueAtTime(0.038, now + 0.016);
    gainResonance.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    oscMain.connect(gainResonance);
    oscHarm.connect(gainResonance);
    gainResonance.connect(ctx.destination);

    oscMain.start(now + 0.004);
    oscHarm.start(now + 0.004);
    oscMain.stop(now + 0.14);
    oscHarm.stop(now + 0.14);

    // --- CAPA 3: Impulso Gravitacional de Masa (Sub-grave táctil de 40ms) ---
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.04);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.exponentialRampToValueAtTime(0.022, now + 0.008);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.05);

    triggerHapticPulse('light');
  } catch {}
}

/**
 * Resonancia inercial suave al rotar la esfera en drag
 */
export function playGiroDriftSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  } catch {}
}

/**
 * Salto cuántico / Whoosh al alternar entre polos Workspace y Habit Core
 */
export function playWarpJumpSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);

    triggerHapticPulse('light');
  } catch {}
}

