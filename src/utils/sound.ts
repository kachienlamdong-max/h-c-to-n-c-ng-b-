let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType,
  startOffset = 0,
  volume = 0.14
): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playClickSound(): void {
  playTone(540, 0.06, 'sine', 0, 0.08);
}

export function playCountTick(step = 0): void {
  const base = 440 * Math.pow(1.06, Math.min(step, 14));
  playTone(base, 0.08, 'triangle', 0, 0.1);
}

export function playCorrectSound(): void {
  playTone(523.25, 0.13, 'triangle', 0, 0.16); // C5
  playTone(659.25, 0.13, 'triangle', 0.09, 0.16); // E5
  playTone(783.99, 0.15, 'triangle', 0.18, 0.16); // G5
  playTone(1046.5, 0.26, 'sine', 0.27, 0.18); // C6
}

export function playIncorrectSound(): void {
  playTone(311.13, 0.16, 'sawtooth', 0, 0.07); // Eb4
  playTone(233.08, 0.24, 'sawtooth', 0.14, 0.07); // Bb3
}

export function playFanfareSound(): void {
  playTone(523.25, 0.12, 'triangle', 0, 0.15);
  playTone(659.25, 0.12, 'triangle', 0.1, 0.15);
  playTone(783.99, 0.12, 'triangle', 0.2, 0.15);
  playTone(1046.5, 0.35, 'triangle', 0.3, 0.2);
}
