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

export function clearWelcomedSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CC_WELCOMED_KEY);
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
 * Genera una ráfaga de squelch de radio militar (ruido filtrado pasobanda)
 * Característico de la activación y corte de transceptores en StarCraft Terran
 */
function playCommsSquelchBurst(ctx: AudioContext, time: number, duration: number = 0.032, gainLevel: number = 0.016) {
  try {
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (frameCount * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
  } catch {}
}

/**
 * Chime de enlace de comunicaciones militares estilo StarCraft Terran Adjutant
 * Combina micro-squelch de radiofrecuencia + chirp digital dual de cabina + eco de mamparo
 */
export function playSpaceshipEchoChime() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Squelch de apertura de radio militar ("kzz-click")
    playCommsSquelchBurst(ctx, now, 0.028, 0.02);

    // 2. Tono digital táctico StarCraft (987.77Hz B5 -> 1567.98Hz G6 en arpegio militar ultrarrápido)
    const tones = [
      { freq: 987.77, time: now + 0.022 },
      { freq: 1567.98, time: now + 0.065 },
    ];

    tones.forEach(({ freq, time }) => {
      // Onda directa sintetizada
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.045, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.3);

      // Eco de mamparo táctico (+80ms)
      const echoOsc = ctx.createOscillator();
      const echoGain = ctx.createGain();
      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(800, time);

      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(freq, time + 0.08);
      echoGain.gain.setValueAtTime(0.0001, time + 0.08);
      echoGain.gain.exponentialRampToValueAtTime(0.018, time + 0.09);
      echoGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);

      echoOsc.connect(echoFilter);
      echoFilter.connect(echoGain);
      echoGain.connect(ctx.destination);
      echoOsc.start(time + 0.08);
      echoOsc.stop(time + 0.4);
    });

    // 3. Resonancia sub-grave de presurización de la nave (42Hz)
    const roomSub = ctx.createOscillator();
    const roomGain = ctx.createGain();
    roomSub.type = 'sine';
    roomSub.frequency.setValueAtTime(42, now);
    roomGain.gain.setValueAtTime(0.001, now);
    roomGain.gain.exponentialRampToValueAtTime(0.025, now + 0.03);
    roomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    roomSub.connect(roomGain);
    roomGain.connect(ctx.destination);
    roomSub.start(now);
    roomSub.stop(now + 1.0);
  } catch {}
}

/**
 * Cierre de transmisión militar StarCraft (Roger Beep descendente + corte de squelch)
 */
export function playSpaceshipEchoRoger() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Doble tono descendente militar StarCraft (1400Hz -> 880Hz)
    const tones = [
      { freq: 1396.91, time: now },
      { freq: 880.00, time: now + 0.045 },
    ];

    tones.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.038, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.13);
    });

    // Squelch final de corte de micrófono militar ("ksssh-click")
    playCommsSquelchBurst(ctx, now + 0.09, 0.04, 0.018);
  } catch {}
}

/* ========================================================
   CHASIS ACÚSTICO ANDROIDE / VOCODER RING-MODULATOR STARCRAFT
   Emula la resonancia electromecánica y flutter del Terran Adjutant
   ======================================================== */

interface AndroidVocoderChassis {
  carrierOsc: OscillatorNode;
  carrierFilter: BiquadFilterNode;
  carrierGain: GainNode;
  lfoOsc: OscillatorNode;
  lfoGain: GainNode;
  subOsc: OscillatorNode;
  subGain: GainNode;
  telemetryTimer: NodeJS.Timeout | null;
}

let activeAndroidChassis: AndroidVocoderChassis | null = null;
let androidSafetyTimer: NodeJS.Timeout | null = null;

function startServoRumble(ctx: AudioContext) {
  if (activeAndroidChassis) return;
  try {
    const now = ctx.currentTime;

    // 1. Portadora metálica vocoder (Onda diente de sierra a 175 Hz - frecuencia fundamental de chasis androide)
    const carrierOsc = ctx.createOscillator();
    carrierOsc.type = 'sawtooth';
    carrierOsc.frequency.setValueAtTime(175, now);

    // Filtro pasa banda resonante centrado en formantes mecánicos (1250 Hz, Q: 3.2)
    const carrierFilter = ctx.createBiquadFilter();
    carrierFilter.type = 'bandpass';
    carrierFilter.frequency.setValueAtTime(1250, now);
    carrierFilter.Q.setValueAtTime(3.2, now);

    // Ganancia de la portadora con modulación
    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0.0001, now);
    carrierGain.gain.exponentialRampToValueAtTime(0.0075, now + 0.15);

    // 2. LFO de Ring-Modulation a 28 Hz (el clásico flutter androide de StarCraft / Dalek)
    const lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(28, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.004, now);

    // Conectar modulación LFO a la ganancia de la portadora
    lfoOsc.connect(lfoGain);
    lfoGain.connect(carrierGain.gain);

    carrierOsc.connect(carrierFilter);
    carrierFilter.connect(carrierGain);
    carrierGain.connect(ctx.destination);

    carrierOsc.start(now);
    lfoOsc.start(now);

    // 3. Sub-chasis de servo electromecánico (64 Hz con atenuación de pitos)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(64, now);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.015, now + 0.2);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);

    // 4. Servo lock micro-chirp al inicio de la transmisión (290Hz -> 175Hz en 80ms)
    const servoLockOsc = ctx.createOscillator();
    const servoLockGain = ctx.createGain();
    servoLockOsc.type = 'sine';
    servoLockOsc.frequency.setValueAtTime(290, now);
    servoLockOsc.frequency.exponentialRampToValueAtTime(175, now + 0.08);
    servoLockGain.gain.setValueAtTime(0.009, now);
    servoLockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    servoLockOsc.connect(servoLockGain);
    servoLockGain.connect(ctx.destination);
    servoLockOsc.start(now);
    servoLockOsc.stop(now + 0.09);

    // 5. Pulsos sutiles de telemetría de procesamiento neural mientras la IA habla
    const telemetryTimer = setInterval(() => {
      try {
        const audioCtx = getAudioContext();
        if (!audioCtx || audioCtx.state === 'closed') return;
        const t = audioCtx.currentTime;
        const blipOsc = audioCtx.createOscillator();
        const blipGain = audioCtx.createGain();
        blipOsc.type = 'sine';
        blipOsc.frequency.setValueAtTime(Math.random() > 0.5 ? 1950 : 2350, t);
        blipGain.gain.setValueAtTime(0.002, t);
        blipGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
        blipOsc.connect(blipGain);
        blipGain.connect(audioCtx.destination);
        blipOsc.start(t);
        blipOsc.stop(t + 0.015);
      } catch {}
    }, 320);

    activeAndroidChassis = {
      carrierOsc,
      carrierFilter,
      carrierGain,
      lfoOsc,
      lfoGain,
      subOsc,
      subGain,
      telemetryTimer,
    };

    // Temporizador de seguridad de 24s para garantizar que nunca quede sonando
    if (androidSafetyTimer) clearTimeout(androidSafetyTimer);
    androidSafetyTimer = setTimeout(() => {
      stopServoRumble();
    }, 24000);
  } catch {}
}

function stopServoRumble() {
  if (androidSafetyTimer) {
    clearTimeout(androidSafetyTimer);
    androidSafetyTimer = null;
  }
  if (!activeAndroidChassis) return;
  try {
    const { carrierOsc, carrierFilter, carrierGain, lfoOsc, lfoGain, subOsc, subGain, telemetryTimer } =
      activeAndroidChassis;

    if (telemetryTimer) {
      clearInterval(telemetryTimer);
    }

    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      carrierGain.gain.setValueAtTime(carrierGain.gain.value, now);
      carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      subGain.gain.setValueAtTime(subGain.gain.value, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      setTimeout(() => {
        try {
          carrierOsc.stop();
          lfoOsc.stop();
          subOsc.stop();
          carrierOsc.disconnect();
          carrierFilter.disconnect();
          carrierGain.disconnect();
          lfoOsc.disconnect();
          lfoGain.disconnect();
          subOsc.disconnect();
          subGain.disconnect();
        } catch {}
      }, 220);
    }
    activeAndroidChassis = null;
  } catch {
    activeAndroidChassis = null;
  }
}

export interface PendingTaskVoiceItem {
  id?: string;
  title: string;
  projectName: string;
  priority?: 'alta' | 'media' | 'baja' | string;
  status?: 'iniciado' | 'trabajando' | 'finalizado' | string;
}

export interface ShipVoiceBriefingOptions {
  pendingTasks?: PendingTaskVoiceItem[];
  totalPendingCount?: number;
}

/**
 * Limpieza fonética de texto para síntesis de voz espacial (elimina URLs, markdown y símbolos)
 */
export function sanitizeVoiceText(input: string, maxChars: number = 45): string {
  if (!input) return '';
  // Eliminar URLs
  let text = input.replace(/https?:\/\/\S+/gi, '');
  // Eliminar markdown y caracteres de puntuación conflictivos
  text = text.replace(/[*_#~`\\/|{}[\]<>@$%^&=+]/g, ' ');
  // Colapsar espacios múltiples
  text = text.trim().replace(/\s+/g, ' ');
  if (text.length <= maxChars) return text;
  // Truncar limpiamente sin cortar palabras si es posible
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 15 ? truncated.slice(0, lastSpace) : truncated).trim();
}

// Caché proactivo de voces del sistema para Chromium/Windows
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Genera el guión táctico de voz con puntuación staccato androide
 * Rompe las curvas de entonación humanas para forzar una cadencia clínica, plana y robótica
 */
function buildShipSpeechText(
  firstName: string,
  lang: 'es' | 'en',
  briefing?: ShipVoiceBriefingOptions
): string {
  const intro =
    lang === 'es'
      ? `INICIANDO PROTOCOLO. Identificación. Biométrica. Confirmada. Comandante: ${firstName}.`
      : `PROTOCOL INITIATED. Biometric. Authorization. Confirmed. Commander: ${firstName}.`;

  // Sin informe de tareas provisto: saludo estándar
  if (!briefing || !briefing.pendingTasks) {
    return lang === 'es'
      ? `${intro} Núcleo orbital... en línea. Inteligencia Artificial... a su servicio.`
      : `${intro} Orbital core... online. Artificial Intelligence... standing by.`;
  }

  const count = briefing.totalPendingCount ?? briefing.pendingTasks.length;

  // Cero tareas pendientes
  if (count === 0 || briefing.pendingTasks.length === 0) {
    return lang === 'es'
      ? `${intro} Núcleo orbital sincronizado. Cero tareas pendientes en registro táctico. Todos los sistemas... operativos.`
      : `${intro} Orbital core synchronized. Zero pending directives in tactical logs. All systems... operational.`;
  }

  // 1 tarea pendiente
  if (count === 1 || briefing.pendingTasks.length === 1) {
    const task = briefing.pendingTasks[0];
    const title = sanitizeVoiceText(task.title, 45);
    const project = sanitizeVoiceText(task.projectName, 30);
    const isWorking = task.status === 'trabajando';

    if (lang === 'es') {
      const statusPhrase = isWorking ? 'una tarea en curso' : 'una directiva pendiente';
      return `${intro} Alerta táctica. Tienes ${statusPhrase}: ${title}... en proyecto: ${project}. Sistemas de a bordo... en línea.`;
    } else {
      const statusPhrase = isWorking ? 'one active mission in progress' : 'one pending directive';
      return `${intro} Tactical alert. You have ${statusPhrase}: ${title}... in project: ${project}. Ship systems... online.`;
    }
  }

  // 2 tareas pendientes
  if (count === 2 || briefing.pendingTasks.length === 2) {
    const t1 = briefing.pendingTasks[0];
    const t2 = briefing.pendingTasks[1];
    const title1 = sanitizeVoiceText(t1.title, 40);
    const proj1 = sanitizeVoiceText(t1.projectName, 26);
    const title2 = sanitizeVoiceText(t2.title, 40);
    const proj2 = sanitizeVoiceText(t2.projectName, 26);

    if (lang === 'es') {
      return `${intro} Informe táctico. Dos tareas activas en registro. Misión prioritaria: ${title1}... en proyecto: ${proj1}. Tarea secundaria: ${title2}... en: ${proj2}. Sistemas listos.`;
    } else {
      return `${intro} Tactical report. Two active missions in logs. Priority mission: ${title1}... in project: ${proj1}. Secondary task: ${title2}... in: ${proj2}. Systems ready.`;
    }
  }

  // 3 o más tareas pendientes
  const primaryTask = briefing.pendingTasks[0];
  const primaryTitle = sanitizeVoiceText(primaryTask.title, 45);
  const primaryProject = sanitizeVoiceText(primaryTask.projectName, 28);

  if (lang === 'es') {
    return `${intro} Informe táctico. Tienes ${count} directivas en registro. Misión prioritaria: ${primaryTitle}... en proyecto: ${primaryProject}. Inteligencia Artificial... a su servicio.`;
  } else {
    return `${intro} Tactical report. You have ${count} pending directives. Priority mission: ${primaryTitle}... in project: ${primaryProject}. Artificial Intelligence... standing by.`;
  }
}

/**
 * Saludo protocolario por voz de la Inteligencia Artificial de a bordo
 * Calibrado fielmente al Terran Adjutant de StarCraft 2 (voz androide clínica, fría y sintetizada)
 */
export function playShipWelcomeVoice(
  userName: string,
  customLang?: 'es' | 'en',
  briefing?: ShipVoiceBriefingOptions
) {
  if (!isSoundEnabled()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    stopServoRumble();
    activeUtterance = null;

    const lang = customLang || getSoundLanguage();
    const firstName = userName ? userName.trim().split(' ')[0] : (lang === 'es' ? 'Comandante' : 'Commander');

    // Generar guión táctico estructurado con puntuación androide staccato
    const text = buildShipSpeechText(firstName, lang, briefing);

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance; // Retener referencia para evitar recolección de basura de Chromium
    utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';

    // Priorización de voces estilo StarCraft 2 Terran Adjutant (androide sintetizada clínica y limpia)
    const selectBestVoice = () => {
      let voices = window.speechSynthesis.getVoices();
      if ((!voices || voices.length === 0) && cachedVoices.length > 0) {
        voices = cachedVoices;
      }
      if (!voices || voices.length === 0) return;

      const langCode = lang === 'es' ? 'es' : 'en';
      const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));

      if (langVoices.length > 0) {
        // Excluir voces naturales "Neural" excesivamente emocionales y humanas
        const nonNeuralVoices = langVoices.filter((v) => {
          const n = v.name.toLowerCase();
          return !n.includes('natural') && !n.includes('neural') && !n.includes('online');
        });

        const pool = nonNeuralVoices.length > 0 ? nonNeuralVoices : langVoices;

        // Prioridad 1: Voces sintéticas clásicas de escritorio "Desktop" (Helena Desktop, Sabina Desktop, Laura Desktop, Zira Desktop)
        const desktopVoice = pool.find((v) => {
          const n = v.name.toLowerCase();
          return (
            n.includes('desktop') &&
            (n.includes('helena') ||
              n.includes('sabina') ||
              n.includes('laura') ||
              n.includes('zira') ||
              n.includes('hazel') ||
              n.includes('susan') ||
              n.includes('monica') ||
              n.includes('paulina') ||
              n.includes('female'))
          );
        });

        // Prioridad 2: Cualquier voz femenina no neural
        const femaleVoice =
          desktopVoice ||
          pool.find((v) => {
            const n = v.name.toLowerCase();
            return (
              n.includes('helena') ||
              n.includes('sabina') ||
              n.includes('laura') ||
              n.includes('zira') ||
              n.includes('hazel') ||
              n.includes('susan') ||
              n.includes('monica') ||
              n.includes('paulina') ||
              n.includes('elena') ||
              n.includes('lucia') ||
              n.includes('female')
            );
          });

        // Prioridad 3: Voces Google o Desktop alternativas
        const fallbackVoice =
          pool.find((v) => v.name.toLowerCase().includes('google')) ||
          pool.find((v) => v.name.toLowerCase().includes('desktop')) ||
          pool[0];

        const preferredVoice = femaleVoice || fallbackVoice;
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
    };

    selectBestVoice();

    // Modulación acústica estilo StarCraft II Terran Adjutant:
    // Pitch 0.82 ubica la voz en una tesitura androide gélida, desprovista de emoción humana
    // Rate 0.84 establece la cadencia milimétrica, controlada y deliberada de una supercomputadora
    const isFemaleVoice = utterance.voice?.name.toLowerCase().match(/helena|sabina|laura|monica|paulina|zira|hazel|susan|elena|lucia|female/);
    utterance.pitch = isFemaleVoice ? 0.82 : 0.88;
    utterance.rate = 0.84;
    utterance.volume = 1.0;

    // Disparar chime de intercomunicador con squelch de radio StarCraft
    playSpaceshipEchoChime();

    utterance.onstart = () => {
      const ctx = getAudioContext();
      if (ctx) startServoRumble(ctx);
    };

    // Al finalizar la voz: apagar servo vocoder y emitir corte de squelch militar StarCraft
    utterance.onend = () => {
      stopServoRumble();
      activeUtterance = null;
      playSpaceshipEchoRoger();
    };

    utterance.onerror = () => {
      stopServoRumble();
      activeUtterance = null;
    };

    // Retardo de 260ms para permitir que el squelch inicial resuene antes de la primera palabra
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

