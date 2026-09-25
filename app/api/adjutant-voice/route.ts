import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';

// Caché en memoria: seguro para Vercel, serverless y local (evita cualquier error EROFS)
const memoryCache = new Map<string, { buffer: Buffer; contentType: string; dspApplied: boolean }>();

const tempDir = path.join(os.tmpdir(), 'adjutant_temp');
const cacheDir = path.join(os.tmpdir(), 'adjutant_cache');
try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
} catch {}

function applyBlizzardDSP(rawWavPath: string, outputPath?: string): Buffer {
  const buf = fs.readFileSync(rawWavPath);
  const sampleRate = buf.readUInt32LE(24);
  const dataOffset = buf.indexOf('data') + 8;
  const numSamples = Math.floor((buf.length - dataOffset) / 2);

  const rawSamples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    rawSamples[i] = buf.readInt16LE(dataOffset + i * 2) / 32768.0;
  }

  // Duración de squelch inicial y final
  const introSquelchSec = 0.05;
  const outroRogerSec = 0.18;
  const introSquelchSamples = Math.floor(sampleRate * introSquelchSec);
  const outroRogerSamples = Math.floor(sampleRate * outroRogerSec);

  const totalSamples = introSquelchSamples + numSamples + outroRogerSamples;
  const outSamples = new Float32Array(totalSamples);

  // 1. Squelch inicial de apertura ("kzz-click")
  for (let i = 0; i < introSquelchSamples; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * 2400 * t);
    const env = (1.0 - i / introSquelchSamples) * 0.12;
    outSamples[i] = noise * env;
  }

  // 2. Ring Modulator (30 Hz) + Comb Filter metálico (26ms) + Bandpass EQ (350Hz)
  const ringFreq = 30.0;
  const ringDepth = 0.42;
  const combDelay = Math.floor(sampleRate * 0.026);
  const combFeedback = 0.36;
  const combBuffer = new Float32Array(numSamples);
  let hpPrevIn = 0;
  let hpPrevOut = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Modulación en anillo a 30 Hz
    const ringCarrier = Math.sin(2 * Math.PI * ringFreq * t);
    const ringed = rawSamples[i] * (1.0 - ringDepth + ringDepth * ringCarrier);

    // Comb filter metálico
    const delayed = i >= combDelay ? combBuffer[i - combDelay] : 0;
    const combed = ringed + combFeedback * delayed;
    combBuffer[i] = combed;

    // Filtro Paso Alto a 350 Hz para eliminar graves
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

  const dataByteSize = totalSamples * 2;
  const finalBuf = Buffer.alloc(44 + dataByteSize);
  buf.copy(finalBuf, 0, 0, 44);
  finalBuf.writeUInt32LE(36 + dataByteSize, 4);
  finalBuf.writeUInt32LE(dataByteSize, 40);

  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1.0, Math.min(1.0, outSamples[i] * gain));
    finalBuf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, finalBuf);
    } catch {}
  }
  return finalBuf;
}

async function fetchGoogleTTSBuffer(text: string, lang: string): Promise<Buffer> {
  const rawChunks = text.match(/[^.,;!?]+[.,;!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const piece of rawChunks) {
    if ((current + ' ' + piece).trim().length > 130) {
      if (current.trim()) chunks.push(current.trim());
      current = piece;
    } else {
      current = (current + ' ' + piece).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/mpeg, audio/*, */*',
      },
    });
    if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    // Verificar que la respuesta sea audio y no una página HTML de captcha
    const isAudio = (buf.length > 200) && (
      (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) ||
      buf.slice(0, 3).toString() === 'ID3' ||
      !buf.slice(0, 20).toString().includes('<html')
    );
    if (!isAudio) throw new Error('Google TTS returned non-audio response');
    buffers.push(buf);
  }

  return Buffer.concat(buffers);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = (searchParams.get('lang') || 'es').toLowerCase() === 'en' ? 'en' : 'es';

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const cleanText = text.trim().slice(0, 450);
    const cacheKey = `${lang}:${cleanText}`;

    // 1. Servir desde caché en memoria si existe (0ms, ultra-rápido)
    const memCached = memoryCache.get(cacheKey);
    if (memCached) {
      return new Response(new Uint8Array(memCached.buffer), {
        status: 200,
        headers: {
          'Content-Type': memCached.contentType,
          'Cache-Control': 'public, max-age=604800, immutable',
          'x-dsp-applied': memCached.dspApplied ? 'true' : 'false',
        },
      });
    }

    const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
    const cachedWavPath = path.join(cacheDir, `${hash}.wav`);
    const cachedMp3Path = path.join(cacheDir, `${hash}.mp3`);

    // 2. Servir desde caché WAV en disco (ya procesado con Blizzard DSP)
    try {
      if (fs.existsSync(cachedWavPath)) {
        const cachedBuf = fs.readFileSync(cachedWavPath);
        memoryCache.set(cacheKey, { buffer: cachedBuf, contentType: 'audio/wav', dspApplied: true });
        return new Response(new Uint8Array(cachedBuf), {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=604800, immutable',
            'x-dsp-applied': 'true',
          },
        });
      }
    } catch {}

    // 3. Servir desde caché MP3 en disco
    try {
      if (fs.existsSync(cachedMp3Path)) {
        const cachedBuf = fs.readFileSync(cachedMp3Path);
        memoryCache.set(cacheKey, { buffer: cachedBuf, contentType: 'audio/mpeg', dspApplied: false });
        return new Response(new Uint8Array(cachedBuf), {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800, immutable',
            'x-dsp-applied': 'false',
          },
        });
      }
    } catch {}

    // 4. Intento en Windows: SAPI Helena/Zira Desktop + Blizzard DSP en servidor
    if (process.platform === 'win32') {
      try {
        const voice = lang === 'en' ? 'Microsoft Zira Desktop' : 'Microsoft Helena Desktop';
        const tempRawPath = path.join(tempDir, `raw_${hash}.wav`);
        const cleanTextSafe = cleanText.replace(/'/g, "''");

        const psScript = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$targetVoice = '${voice}'
try { $s.SelectVoice($targetVoice) } catch {
  $v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -match 'Helena|Sabina|Laura|Zira|Desktop' } | Select-Object -First 1
  if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }
}
$s.Rate = -1
$s.SetOutputToWaveFile('${tempRawPath.replace(/\\/g, '/')}')
$s.Speak('${cleanTextSafe}')
$s.Dispose()
`;

        const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');

        await new Promise<void>((resolve, reject) => {
          exec(
            `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}`,
            { timeout: 6000 },
            (err, _stdout, stderr) => {
              if (err) return reject(new Error(stderr || err.message));
              if (!fs.existsSync(tempRawPath)) return reject(new Error('SAPI output file was not created'));
              resolve();
            }
          );
        });

        const dspBuf = applyBlizzardDSP(tempRawPath, cachedWavPath);
        try { fs.unlinkSync(tempRawPath); } catch {}

        memoryCache.set(cacheKey, { buffer: dspBuf, contentType: 'audio/wav', dspApplied: true });

        return new Response(new Uint8Array(dspBuf), {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=604800, immutable',
            'x-dsp-applied': 'true',
          },
        });
      } catch (sapiErr) {
        console.warn('Windows SAPI execution failed, falling back to universal Google TTS:', sapiErr);
      }
    }

    // 5. Universal (Vercel / Linux / Docker / Fallback): Obtener audio de voz limpio vía Google TTS
    const mp3Buf = await fetchGoogleTTSBuffer(cleanText, lang);
    try {
      fs.writeFileSync(cachedMp3Path, mp3Buf);
    } catch {}

    memoryCache.set(cacheKey, { buffer: mp3Buf, contentType: 'audio/mpeg', dspApplied: false });

    return new Response(new Uint8Array(mp3Buf), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'x-dsp-applied': 'false',
      },
    });
  } catch (error: any) {
    console.error('Error generating adjutant voice:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
