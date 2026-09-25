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

/**
 * Saludo por voz sintetizada de la computadora de a bordo (Web Speech API)
 * Configurado con modulación de IA espacial ("Starship Onboard AI")
 */
export function playShipWelcomeVoice(userName: string, customLang?: 'es' | 'en') {
  if (!isSoundEnabled()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    const lang = customLang || getSoundLanguage();
    const firstName = userName ? userName.trim().split(' ')[0] : (lang === 'es' ? 'Comandante' : 'Commander');

    const text =
      lang === 'es'
        ? `Comandante ${firstName}, puente de mando en línea. Todos los sistemas orbitales sincronizados.`
        : `Commander ${firstName}, command bridge online. All orbital systems synchronized.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';
    utterance.pitch = 1.05; // Timbre ligeramente estilizado de interfaz
    utterance.rate = 1.02;  // Cadencia militar / protocolaria espacial
    utterance.volume = 0.85;

    // Intentar seleccionar la mejor voz disponible del idioma
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchingVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith(lang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch {}
}

/* ========================================================
   ZUMBIDO AMBIENTAL DE CABINA (WARP CORE DRONE)
   ======================================================== */

interface AmbientDroneInstance {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  lfo: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  ctx: AudioContext;
}

let activeDrone: AmbientDroneInstance | null = null;

/**
 * Inicia el zumbido ambiental de baja frecuencia de la nave (Warp Core Hum)
 * 100% procedural, muy sutil (volumen ~3.5%) con modulación lenta
 */
export function startAmbientWarpDrone() {
  if (!isSoundEnabled() || activeDrone) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Oscilador subgrave 1 (52Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(52, now);

    // 2. Oscilador subgrave 2 desfasado (55.5Hz) -> genera pulso binaural zen de 3.5Hz
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55.5, now);

    // 3. Filtro paso-bajo para aislar solo la vibración cálida
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(95, now);

    // 4. LFO muy lento (0.15Hz) para respiración sónica del reactor
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, now);
    lfoGain.gain.setValueAtTime(18, now); // Modula el filtro ±18Hz
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // 5. Ganancia maestra del drone con fade-in suave de 2 segundos
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 2.0); // Volumen suave y tranquilizante

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    activeDrone = { osc1, osc2, lfo, filter, gain, ctx };
  } catch {}
}

/**
 * Detiene el zumbido ambiental con fade-out suave
 */
export function stopAmbientWarpDrone() {
  if (!activeDrone) return;
  try {
    const { osc1, osc2, lfo, gain, ctx } = activeDrone;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    setTimeout(() => {
      try {
        osc1.stop();
        osc2.stop();
        lfo.stop();
        osc1.disconnect();
        osc2.disconnect();
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
 * Micro-blip de telemetría al pasar el cursor sobre un mini-planeta
 */
export function playPlanetTelemetrySound(planetId: string) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqMap: Record<string, number> = {
      board: 1174.66,     // D6
      dashboard: 1318.51, // E6
      calendar: 1396.91,  // F6
      pomodoro: 1046.50,  // C6
      habits: 1244.51,    // D#6
      challenges: 1479.98,// F#6
      goals: 1567.98,     // G6
    };

    const freq = freqMap[planetId] || 1200;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.035);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);

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

