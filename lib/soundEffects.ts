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
    stopAdjutantAudio();
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
   RESONADOR METÁLICO CIBERNÉTICO SINCRONIZADO POR PALABRA
   Aplica el característico timbre androide de StarCraft a cada sílaba
   sin producir ruidos graves ni zumbidos continuos en el fondo.
   ======================================================== */

/**
 * Impulso de resonancia metálica que acompaña la dicción de cada palabra (onboundary)
 */
export function playRobotWordMetallicRing(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;

    // Resonador de formante metálico cibernético (1380 Hz, Q: 6.5)
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(185, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1380, now);
    filter.Q.setValueAtTime(6.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.0055, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {}
}

let boundaryFallbackInterval: NodeJS.Timeout | null = null;

function startServoRumble(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;

    // Micro-servo de bloqueo mecánico al inicio (290Hz -> 175Hz en 80ms)
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

    // Fallback de cadencia metálica cada 280ms por si el navegador no emite onboundary
    if (boundaryFallbackInterval) clearInterval(boundaryFallbackInterval);
    boundaryFallbackInterval = setInterval(() => {
      try {
        const audioCtx = getAudioContext();
        if (audioCtx && audioCtx.state !== 'closed') {
          playRobotWordMetallicRing(audioCtx);
        }
      } catch {}
    }, 280);
  } catch {}
}

function stopServoRumble() {
  if (boundaryFallbackInterval) {
    clearInterval(boundaryFallbackInterval);
    boundaryFallbackInterval = null;
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
 * Genera el guión táctico de voz con identificación de usuario, tareas pendientes y proyectos
 */
function buildShipSpeechText(
  firstName: string,
  lang: 'es' | 'en',
  briefing?: ShipVoiceBriefingOptions
): string {
  const commanderTitle = lang === 'es' ? 'Comandante' : 'Commander';
  const userGreeting = firstName ? `${commanderTitle} ${firstName}` : commanderTitle;

  const intro =
    lang === 'es'
      ? `INICIANDO PROTOCOLO. Identificación biométrica confirmada. ${userGreeting}...`
      : `PROTOCOL INITIATED. Biometric authorization confirmed. ${userGreeting}...`;

  const count = briefing?.totalPendingCount ?? (briefing?.pendingTasks?.length ?? 0);

  // Cero tareas pendientes o sin briefing
  if (!briefing || !briefing.pendingTasks || briefing.pendingTasks.length === 0 || count === 0) {
    return lang === 'es'
      ? `${intro} Núcleo orbital sincronizado. No se detectan tareas pendientes en el registro táctico. Todos los sistemas operativos.`
      : `${intro} Orbital core synchronized. No pending tasks detected in tactical logs. All systems operational.`;
  }

  // 1 tarea pendiente
  if (count === 1 || briefing.pendingTasks.length === 1) {
    const task = briefing.pendingTasks[0];
    const title = sanitizeVoiceText(task.title, 45);
    const project = sanitizeVoiceText(task.projectName, 30);
    const isWorking = task.status === 'trabajando';

    if (lang === 'es') {
      const statusPhrase = isWorking ? 'una tarea en curso' : 'una tarea pendiente';
      return `${intro} Alerta táctica: Tienes ${statusPhrase}: ${title}... en el proyecto... ${project}. Sistemas de abordo en línea.`;
    } else {
      const statusPhrase = isWorking ? 'one active mission in progress' : 'one pending task';
      return `${intro} Tactical alert: You have ${statusPhrase}: ${title}... in project... ${project}. Ship systems online.`;
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
      return `${intro} Informe táctico: Tienes dos tareas activas. Misión prioritaria: ${title1}... en el proyecto... ${proj1}... y tarea secundaria: ${title2}... en... ${proj2}. Sistemas listos.`;
    } else {
      return `${intro} Tactical report: You have two active missions. Priority: ${title1}... in project... ${proj1}... and secondary: ${title2}... in... ${proj2}. Systems ready.`;
    }
  }

  // 3 o más tareas pendientes
  const primaryTask = briefing.pendingTasks[0];
  const primaryTitle = sanitizeVoiceText(primaryTask.title, 45);
  const primaryProject = sanitizeVoiceText(primaryTask.projectName, 28);

  if (lang === 'es') {
    return `${intro} Informe táctico: Tienes ${count} tareas pendientes. Misión prioritaria: ${primaryTitle}... en el proyecto... ${primaryProject}. Inteligencia Artificial a su servicio.`;
  } else {
    return `${intro} Tactical report: You have ${count} pending tasks. Priority mission: ${primaryTitle}... in project... ${primaryProject}. Artificial Intelligence standing by.`;
  }
}

let currentSessionId = 0;
let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioSourceNode: AudioBufferSourceNode | null = null;
let activeAbortController: AbortController | null = null;
let registeredAudioTimers: NodeJS.Timeout[] = [];
let voiceStatusListeners: ((isPlaying: boolean) => void)[] = [];

export function registerVoiceStatusListener(listener: (isPlaying: boolean) => void): () => void {
  voiceStatusListeners.push(listener);
  return () => {
    voiceStatusListeners = voiceStatusListeners.filter((l) => l !== listener);
  };
}

function notifyVoiceStatus(isPlaying: boolean) {
  voiceStatusListeners.forEach((fn) => {
    try {
      fn(isPlaying);
    } catch {}
  });
}

export function registerAudioTimer(timer: NodeJS.Timeout): void {
  registeredAudioTimers.push(timer);
}

export function stopAdjutantAudio(): void {
  // 1. Invalidar cualquier sesión asíncrona en curso (fetch, decode, timeouts)
  currentSessionId++;

  // 2. Limpiar todos los temporizadores pendientes de audio
  registeredAudioTimers.forEach((timer) => clearTimeout(timer));
  registeredAudioTimers = [];

  // 3. Cancelar cualquier petición de red en curso
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {}
    activeAbortController = null;
  }

  // 4. Detener nodo de audio Web Audio en curso si existe
  if (activeAudioSourceNode) {
    try {
      activeAudioSourceNode.stop();
      activeAudioSourceNode.disconnect();
    } catch {}
    activeAudioSourceNode = null;
  }

  // 5. Detener y desechar cualquier elemento de audio HTML activo de inmediato
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
      activeAudioElement.load();
    } catch {}
    activeAudioElement = null;
  }

  // 6. Cancelar síntesis de voz del navegador
  stopServoRumble();
  activeUtterance = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  // 7. Notificar al HUD que la voz se ha detenido
  notifyVoiceStatus(false);
}

/**
 * Cadena de efectos Blizzard DSP StarCraft 2 Terran Adjutant (procesamiento en tiempo real):
 * - 0.05s Squelch inicial militar
 * - 30 Hz Ring Modulator (multiplicador de frecuencia robótica cibernética)
 * - 26ms Comb Filter con feedback 0.38 (cámara metálica / diafragma de acero)
 * - 350 Hz Filtro Paso Alto (elimina calidez o resonancia pectoral humana)
 * - 0.18s Roger Beep militar descendente (1396 Hz -> 880 Hz)
 */
function applyBlizzardDSPClient(rawSamples: Float32Array, sampleRate: number): Float32Array {
  const numSamples = rawSamples.length;
  const introSquelchSec = 0.05;
  const outroRogerSec = 0.18;
  const introSquelchSamples = Math.floor(sampleRate * introSquelchSec);
  const outroRogerSamples = Math.floor(sampleRate * outroRogerSec);

  const totalSamples = introSquelchSamples + numSamples + outroRogerSamples;
  const outSamples = new Float32Array(totalSamples);

  // 1. Squelch inicial de apertura de transceptor ("kzz-click")
  for (let i = 0; i < introSquelchSamples; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * 2400 * t);
    const env = (1.0 - i / introSquelchSamples) * 0.12;
    outSamples[i] = noise * env;
  }

  // 2. Ring Modulator (30 Hz) + Comb Filter metálico (26ms) + Highpass EQ (350Hz)
  const ringFreq = 30.0;
  const ringDepth = 0.42;
  const combDelay = Math.floor(sampleRate * 0.026);
  const combFeedback = 0.36;
  const combBuffer = new Float32Array(numSamples);
  let hpPrevIn = 0;
  let hpPrevOut = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const ringCarrier = Math.sin(2 * Math.PI * ringFreq * t);
    const ringed = rawSamples[i] * (1.0 - ringDepth + ringDepth * ringCarrier);

    const delayed = i >= combDelay ? combBuffer[i - combDelay] : 0;
    const combed = ringed + combFeedback * delayed;
    combBuffer[i] = combed;

    const hp = combed - hpPrevIn + 0.90 * hpPrevOut;
    hpPrevIn = combed;
    hpPrevOut = hp;

    outSamples[introSquelchSamples + i] = hp;
  }

  // 3. Roger Beep militar descendente al final (1396 Hz -> 880 Hz)
  const rogerStart = introSquelchSamples + numSamples;
  for (let i = 0; i < outroRogerSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.08 ? 1396.91 : 880.0;
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.06;
    const env = Math.exp(-t * 18);
    outSamples[rogerStart + i] = tone * env;
  }

  // Normalización pico a -1 dB (0.89)
  let maxAmp = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(outSamples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  const gain = maxAmp > 0 ? 0.89 / maxAmp : 1.0;
  for (let i = 0; i < totalSamples; i++) {
    outSamples[i] = Math.max(-1.0, Math.min(1.0, outSamples[i] * gain));
  }

  return outSamples;
}

/**
 * Saludo protocolario por voz de la Inteligencia Artificial de a bordo
 * Genera dinámicamente el audio con el nombre del usuario, tareas y proyectos
 * procesado con la cadena Blizzard DSP de StarCraft 2: Terran Adjutant
 * Garantiza CERO solapamientos y la voz androide en cualquier plataforma.
 */
export function playShipWelcomeVoice(
  userName: string,
  customLang?: 'es' | 'en',
  briefing?: ShipVoiceBriefingOptions
) {
  if (!isSoundEnabled()) return;
  if (typeof window === 'undefined') return;

  try {
    // 1. Detener de forma sincrónica cualquier audio previo
    stopAdjutantAudio();

    const thisSessionId = currentSessionId;
    const lang = customLang || getSoundLanguage();

    // 2. Limpieza fonética del nombre: si es correo electrónico o nombre largo, extraer solo el primer nombre
    let cleanName = userName ? userName.trim() : '';
    if (cleanName.includes('@')) {
      cleanName = cleanName.split('@')[0].replace(/[._-]/g, ' ');
    }
    const rawFirst = cleanName ? cleanName.split(' ')[0] : '';
    const firstName = rawFirst
      ? sanitizeVoiceText(rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase(), 25)
      : '';

    const text = buildShipSpeechText(firstName, lang, briefing);

    // 3. Notificar estado activo de inmediato
    notifyVoiceStatus(true);

    const abortController = new AbortController();
    activeAbortController = abortController;

    const dynamicUrl = `/api/adjutant-voice?lang=${lang}&text=${encodeURIComponent(text)}`;

    fetch(dynamicUrl, { signal: abortController.signal })
      .then(async (response) => {
        if (thisSessionId !== currentSessionId) return;
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }
        const isDspApplied = response.headers.get('x-dsp-applied') === 'true';
        const arrayBuf = await response.arrayBuffer();
        if (thisSessionId !== currentSessionId) return;

        const ctx = getAudioContext();
        if (!ctx) {
          playApprovedAdjutantClip(lang, briefing);
          return;
        }

        // Decodificar el audio en un AudioBuffer nativo
        const audioBuffer = await ctx.decodeAudioData(arrayBuf);
        if (thisSessionId !== currentSessionId) return;

        let finalAudioBuffer: AudioBuffer;

        if (isDspApplied) {
          finalAudioBuffer = audioBuffer;
        } else {
          // Aplicar la cadena completa Blizzard DSP en el cliente (Ring Modulator 30Hz, Comb Filter 26ms, High-pass 350Hz, Squelch, Roger)
          const rawSamples = audioBuffer.getChannelData(0);
          const dspSamples = applyBlizzardDSPClient(rawSamples, ctx.sampleRate);
          finalAudioBuffer = ctx.createBuffer(1, dspSamples.length, ctx.sampleRate);
          finalAudioBuffer.getChannelData(0).set(dspSamples);
        }

        const source = ctx.createBufferSource();
        source.buffer = finalAudioBuffer;
        source.connect(ctx.destination);
        activeAudioSourceNode = source;

        source.onended = () => {
          if (thisSessionId === currentSessionId) {
            activeAudioSourceNode = null;
            notifyVoiceStatus(false);
          }
        };

        source.start();
      })
      .catch((err) => {
        if (thisSessionId !== currentSessionId) return;
        if (err.name === 'AbortError') return;
        // Fallback garantizado a los clips aprobados de StarCraft Adjutant
        playApprovedAdjutantClip(lang, briefing);
      });
  } catch {
    playApprovedAdjutantClip(customLang || 'es', briefing);
  }
}

/**
 * Fallback a los clips estáticos de StarCraft Terran Adjutant aprobados
 */
function playApprovedAdjutantClip(
  lang: 'es' | 'en',
  briefing?: ShipVoiceBriefingOptions
) {
  try {
    const count = briefing?.totalPendingCount ?? (briefing?.pendingTasks?.length ?? 0);
    let clipFile = `adjutant_generic_${lang}.wav`;
    if (briefing && briefing.pendingTasks) {
      if (count === 0) clipFile = `adjutant_ready_${lang}.wav`;
      else if (count === 1) clipFile = `adjutant_single_${lang}.wav`;
      else clipFile = `adjutant_multi_${lang}.wav`;
    }

    const staticAudio = new Audio(`/sounds/adjutant/${clipFile}`);
    activeAudioElement = staticAudio;
    staticAudio.volume = 1.0;
    staticAudio.onended = () => {
      activeAudioElement = null;
      notifyVoiceStatus(false);
    };
    notifyVoiceStatus(true);
    staticAudio.play().catch(() => {
      notifyVoiceStatus(false);
    });
  } catch {
    notifyVoiceStatus(false);
  }
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

