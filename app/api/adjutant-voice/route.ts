import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';

const cacheDir = path.join(process.cwd(), 'public', 'sounds', 'adjutant', 'cache');
const tempDir = path.join(process.cwd(), 'scratch_adjutant_temp');

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

function applyBlizzardDSP(rawWavPath: string, outputPath: string): Buffer {
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

  fs.writeFileSync(outputPath, finalBuf);
  return finalBuf;
}

async function fetchGoogleTTSBuffer(text: string, lang: string): Promise<Buffer> {
  const rawChunks = text.match(/[^.,;!?]+[.,;!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const piece of rawChunks) {
    if ((current + ' ' + piece).trim().length > 180) {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    buffers.push(Buffer.from(arrayBuf));
  }

  return Buffer.concat(buffers);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = (searchParams.get('lang') || 'es').toLowerCase();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const cleanText = text.trim().slice(0, 450);
    const hash = crypto.createHash('md5').update(`${lang}:${cleanText}`).digest('hex');
    const cachedWavPath = path.join(cacheDir, `${hash}.wav`);
    const cachedMp3Path = path.join(cacheDir, `${hash}.mp3`);

    // 1. Servir desde caché WAV (ya procesado con DSP)
    if (fs.existsSync(cachedWavPath)) {
      const cachedBuf = fs.readFileSync(cachedWavPath);
      return new Response(new Uint8Array(cachedBuf), {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=604800, immutable',
          'x-dsp-applied': 'true',
        },
      });
    }

    // 2. Servir desde caché MP3
    if (fs.existsSync(cachedMp3Path)) {
      const cachedBuf = fs.readFileSync(cachedMp3Path);
      return new Response(new Uint8Array(cachedBuf), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=604800, immutable',
          'x-dsp-applied': 'false',
        },
      });
    }

    // 3. Intento en Windows: SAPI Helena/Zira Desktop + Blizzard DSP en servidor
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

    // 4. Universal (Vercel / Linux / Docker / Fallback): Obtener audio de voz limpio vía Google TTS
    const mp3Buf = await fetchGoogleTTSBuffer(cleanText, lang);
    try {
      fs.writeFileSync(cachedMp3Path, mp3Buf);
    } catch {}

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
