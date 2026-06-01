import type { ProductKey } from '../types';

export interface VoiceLead {
  name: string;
  phone: string;
  email: string;
  product: ProductKey | '';
}

export type VoiceStatus = 'idle' | 'listening' | 'processing';

let _recognition: any = null;
let _status: VoiceStatus = 'idle';

const SpeechRec = (): any =>
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function isVoiceSupported(): boolean {
  return !!SpeechRec();
}

function parseTranscript(text: string): VoiceLead {
  // Phone — keyword context first, then bare 10-digit number
  let phone = '';
  const phoneKeyword = text.match(
    /(?:phone|mobile|number|contact)\D{0,4}(\d[\d\s\-]{6,12}\d)/i,
  );
  const phoneBare = text.match(/\b([6-9]\d{9})\b/) || text.match(/\b(\d{10})\b/);
  const rawPhone = (phoneKeyword?.[1] ?? phoneBare?.[1] ?? '').replace(/[\s\-]/g, '');
  if (rawPhone.length >= 7) phone = rawPhone;

  // Email
  const emailMatch = text.match(/[\w.+\-]+@[\w\-]+(?:\.[\w]{2,})+/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // Name — "name is X" or "name X"
  let name = '';
  const nameMatch =
    text.match(/(?:my\s+)?name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i) ||
    text.match(/name\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i);
  if (nameMatch) name = nameMatch[1].trim();

  // Product
  let product: ProductKey | '' = '';
  const lower = text.toLowerCase();
  if (/credit\s*card/.test(lower))                          product = 'credit_card';
  else if (/personal\s*loan/.test(lower))                   product = 'personal_loan';
  else if (/home\s*loan/.test(lower))                       product = 'home_loan';
  else if (/\bsaving|\bfd\b|fixed\s*deposit/.test(lower))   product = 'savings_fd';

  return { name, phone, email, product };
}

export function startVoice(
  onStatus: (s: VoiceStatus) => void,
  onResult: (lead: VoiceLead, raw: string) => void,
  onError: (msg: string) => void,
): void {
  if (_status === 'listening') {
    _recognition?.stop();
    return;
  }

  const RC = SpeechRec();
  if (!RC) { onError('Voice not supported in this browser'); return; }

  _recognition = new RC();
  _recognition.continuous = false;
  _recognition.interimResults = false;
  _recognition.lang = 'en-IN';
  _recognition.maxAlternatives = 1;

  _recognition.onstart = () => {
    _status = 'listening';
    onStatus('listening');
  };

  _recognition.onresult = (e: any) => {
    _status = 'processing';
    onStatus('processing');
    const raw: string = e.results[0][0].transcript;
    const lead = parseTranscript(raw);
    onResult(lead, raw);
    _status = 'idle';
    onStatus('idle');
  };

  _recognition.onerror = (e: any) => {
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
    if (_status === 'listening') {
      _status = 'idle';
      onStatus('idle');
    }
  };

  _recognition.start();
}
