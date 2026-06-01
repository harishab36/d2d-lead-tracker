import type { ProductKey } from '../types';

export interface VoiceLead {
  name:    string;
  phone:   string;
  email:   string;
  product: ProductKey | '';
}

export type VoiceStatus  = 'idle' | 'listening' | 'processing';
export type VoiceField   = keyof VoiceLead;

// How long to listen per field before auto-advancing
const STEP_TIMEOUT_MS = 15_000;

const SpeechRec = (): any =>
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function isVoiceSupported(): boolean {
  return !!SpeechRec();
}

// ── Individual field parsers ──────────────────────────────────────────────────

function parseName(text: string): string {
  const m =
    text.match(/(?:my\s+)?name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,3})/i) ||
    text.match(/(?:^|name\s+)([A-Za-z]+(?:\s+[A-Za-z]+){0,3})/i);
  if (m) return m[1].trim();
  // Fallback: treat entire transcript as name when it's 1–3 alpha words
  const words = text.trim().split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
  return words.slice(0, 3).join(' ');
}

function parsePhone(text: string): string {
  const kw   = text.match(/(?:phone|mobile|number|contact)\D{0,4}(\d[\d\s\-]{6,12}\d)/i);
  const flat = text.replace(/\s/g, '');
  const bare = flat.match(/([6-9]\d{9})/) || flat.match(/(\d{10,12})/);
  const raw  = (kw?.[1] ?? bare?.[1] ?? '').replace(/[\s\-]/g, '');
  return raw.length >= 7 ? raw : '';
}

function parseEmail(text: string): string {
  const direct = text.match(/[\w.+\-]+@[\w\-]+(?:\.[\w]{2,})+/i);
  if (direct) return direct[0].toLowerCase();
  // Handle spoken form: "john at gmail dot com"
  const spoken = text.toLowerCase()
    .replace(/\s+at\s+/, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s/g, '');
  const spokenM = spoken.match(/[\w.+\-]+@[\w\-]+(?:\.[\w]{2,})+/);
  return spokenM ? spokenM[0] : '';
}

function parseProduct(text: string): ProductKey | '' {
  const l = text.toLowerCase();
  if (/credit\s*card/.test(l))                       return 'credit_card';
  if (/personal\s*loan/.test(l))                     return 'personal_loan';
  if (/home\s*loan|housing\s*loan|mortgage/.test(l)) return 'home_loan';
  if (/\bsaving|\bfd\b|fixed\s*deposit/.test(l))     return 'savings_fd';
  return '';
}

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  field:  VoiceField;
  prompt: string;
  parse:  (t: string) => string;
}

const STEPS: Step[] = [
  { field: 'name',    prompt: 'Say the customer name',                                                parse: parseName    },
  { field: 'phone',   prompt: 'Say the phone number',                                                 parse: parsePhone   },
  { field: 'email',   prompt: 'Say the email address, or say skip',                                   parse: parseEmail   },
  { field: 'product', prompt: 'Say the product: credit card, personal loan, home loan, or savings',   parse: parseProduct },
];

// ── Speech synthesis ──────────────────────────────────────────────────────────

function speak(text: string): Promise<void> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    const utt   = new SpeechSynthesisUtterance(text);
    utt.lang    = 'en-IN';
    utt.rate    = 1.05;
    utt.onend   = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  });
}

// ── Callback types ────────────────────────────────────────────────────────────

type OnStatus = (
  s:       VoiceStatus,
  secsLeft?: number,
  partial?:  Partial<VoiceLead>,
  field?:    VoiceField,
) => void;
type OnResult = (lead: VoiceLead, raw: string) => void;
type OnError  = (msg: string) => void;

// ── Session state ─────────────────────────────────────────────────────────────

let _recognition: any          = null;
let _status: VoiceStatus       = 'idle';
let _stopped                   = false;
let _collected: Partial<VoiceLead> = {};
let _timeoutId                 = 0;
let _tickerId                  = 0;
let _cbStatus: OnStatus;
let _cbResult: OnResult;
let _cbError:  OnError;

function abort(): void {
  clearTimeout(_timeoutId);
  clearInterval(_tickerId);
  window.speechSynthesis?.cancel();
  if (_recognition) {
    _recognition.onend   = null;
    _recognition.onerror = null;
    _recognition.stop();
    _recognition = null;
  }
}

function deliver(): void {
  _status = 'idle';
  _cbStatus('idle', 0, _collected);
  _cbResult(
    {
      name:    _collected.name    ?? '',
      phone:   _collected.phone   ?? '',
      email:   _collected.email   ?? '',
      product: _collected.product ?? '',
    },
    '',
  );
}

async function runStep(idx: number): Promise<void> {
  if (_stopped || idx >= STEPS.length) { deliver(); return; }

  const step = STEPS[idx];

  // ── Announce the field via TTS ──
  _status = 'processing';
  _cbStatus('processing', 0, _collected, step.field);
  await speak(step.prompt);
  if (_stopped) { deliver(); return; }

  // ── Start recognition for this field ──
  const RC = SpeechRec();
  if (!RC) { _cbError('Voice not supported in this browser'); return; }

  let transcript = '';
  _recognition = new RC();
  _recognition.continuous     = false;
  _recognition.interimResults = false;
  _recognition.lang           = 'en-IN';

  _recognition.onstart = () => {
    _status = 'listening';
    let secsLeft = Math.round(STEP_TIMEOUT_MS / 1000);
    _cbStatus('listening', secsLeft, _collected, step.field);

    _tickerId = window.setInterval(() => {
      secsLeft = Math.max(0, secsLeft - 1);
      _cbStatus('listening', secsLeft, _collected, step.field);
    }, 1_000);

    _timeoutId = window.setTimeout(() => {
      clearInterval(_tickerId);
      _recognition?.stop();
    }, STEP_TIMEOUT_MS);
  };

  _recognition.onresult = (e: any) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) transcript += e.results[i][0].transcript + ' ';
    }
  };

  _recognition.onerror = (e: any) => {
    clearTimeout(_timeoutId);
    clearInterval(_tickerId);
    _recognition = null;
    if (e.error === 'no-speech') {
      runStep(idx + 1); // skip this field silently
    } else if (e.error !== 'aborted') {
      const msgs: Record<string, string> = {
        'not-allowed':   'Microphone access denied.',
        'network':       'Network error. Check connection.',
        'audio-capture': 'No microphone found.',
      };
      _cbError(msgs[e.error] ?? `Voice error: ${e.error}`);
      _status = 'idle';
      _cbStatus('idle');
    }
  };

  _recognition.onend = () => {
    clearTimeout(_timeoutId);
    clearInterval(_tickerId);
    _recognition = null;
    if (_stopped) { deliver(); return; }

    const t = transcript.trim();
    if (t) {
      const val = step.parse(t);
      if (val) (_collected as any)[step.field] = val;
    }
    runStep(idx + 1);
  };

  _recognition.start();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startVoice(
  onStatus: OnStatus,
  onResult: OnResult,
  onError:  OnError,
): void {
  // Tap while active → stop immediately and deliver whatever was captured
  if (_status !== 'idle') {
    _stopped = true;
    abort();
    deliver();
    return;
  }

  _cbStatus  = onStatus;
  _cbResult  = onResult;
  _cbError   = onError;
  _stopped   = false;
  _collected = {};

  runStep(0);
}
