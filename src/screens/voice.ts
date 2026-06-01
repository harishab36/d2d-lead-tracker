import type { ProductKey } from '../types';

export interface VoiceLead {
  name: string;
  phone: string;
  email: string;
  product: ProductKey | '';
}

export type VoiceStatus = 'idle' | 'listening' | 'processing';

const TIMEOUT_MS = 30_000;

let _recognition: any   = null;
let _status: VoiceStatus = 'idle';
let _transcript          = '';
let _timeoutId           = 0;

const SpeechRec = (): any =>
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function isVoiceSupported(): boolean {
  return !!SpeechRec();
}

function parseTranscript(text: string): VoiceLead {
  // Phone — keyword context first, then bare 10-digit number
  let phone = '';
  const phoneKw   = text.match(/(?:phone|mobile|number|contact)\D{0,4}(\d[\d\s\-]{6,12}\d)/i);
  const phoneBare = text.match(/\b([6-9]\d{9})\b/) || text.match(/\b(\d{10})\b/);
  const raw = (phoneKw?.[1] ?? phoneBare?.[1] ?? '').replace(/[\s\-]/g, '');
  if (raw.length >= 7) phone = raw;

  // Email
  const emailM = text.match(/[\w.+\-]+@[\w\-]+(?:\.[\w]{2,})+/i);
  const email   = emailM ? emailM[0].toLowerCase() : '';

  // Name — "name is X" or "name X"
  let name = '';
  const nameM =
    text.match(/(?:my\s+)?name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i) ||
    text.match(/name\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i);
  if (nameM) name = nameM[1].trim();

  // Product
  let product: ProductKey | '' = '';
  const lower = text.toLowerCase();
  if      (/credit\s*card/.test(lower))                         product = 'credit_card';
  else if (/personal\s*loan/.test(lower))                       product = 'personal_loan';
  else if (/home\s*loan/.test(lower))                           product = 'home_loan';
  else if (/\bsaving|\bfd\b|fixed\s*deposit/.test(lower))       product = 'savings_fd';

  return { name, phone, email, product };
}

export function startVoice(
  onStatus: (s: VoiceStatus, secsLeft?: number) => void,
  onResult: (lead: VoiceLead, raw: string) => void,
  onError:  (msg: string) => void,
): void {
  // Second tap — stop and process whatever was captured
  if (_status === 'listening') {
    clearTimeout(_timeoutId);
    _status = 'processing';
    onStatus('processing');
    _recognition?.stop();
    return;
  }

  const RC = SpeechRec();
  if (!RC) { onError('Voice not supported in this browser'); return; }

  _transcript   = '';
  _recognition  = new RC();
  _recognition.continuous      = true;
  _recognition.interimResults  = false;
  _recognition.lang            = 'en-IN';
  _recognition.maxAlternatives = 1;

  _recognition.onstart = () => {
    _status = 'listening';
    onStatus('listening', 30);

    // Countdown ticker — updates every second
    let secsLeft = 30;
    const tick = () => {
      secsLeft--;
      if (_status === 'listening') onStatus('listening', secsLeft);
    };
    const tickerId = window.setInterval(tick, 1000);

    // Hard stop after 30 s
    _timeoutId = window.setTimeout(() => {
      clearInterval(tickerId);
      _status = 'processing';
      onStatus('processing');
      _recognition?.stop();
    }, TIMEOUT_MS);

    // Store tickerId so we can clear it on early stop
    (_recognition as any)._tickerId = tickerId;
  };

  _recognition.onresult = (e: any) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        _transcript += e.results[i][0].transcript + ' ';
      }
    }
  };

  _recognition.onerror = (e: any) => {
    clearTimeout(_timeoutId);
    clearInterval((_recognition as any)._tickerId);
    _status = 'idle';
    onStatus('idle');
    const msgs: Record<string, string> = {
      'no-speech':     'No speech detected. Try again.',
      'not-allowed':   'Microphone access denied.',
      'network':       'Network error. Check connection.',
      'audio-capture': 'No microphone found.',
    };
    if (e.error !== 'aborted') onError(msgs[e.error] ?? `Voice error: ${e.error}`);
  };

  _recognition.onend = () => {
    clearTimeout(_timeoutId);
    clearInterval((_recognition as any)._tickerId);
    const captured = _transcript.trim();
    if (captured && _status !== 'idle') {
      onStatus('processing');
      const lead = parseTranscript(captured);
      onResult(lead, captured);
    }
    _status = 'idle';
    onStatus('idle');
  };

  _recognition.start();
}
