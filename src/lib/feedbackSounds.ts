// Subtle, calming audio feedback for Light Points, streaks, and tip submissions.
// Sounds are synthesized with the Web Audio API so they stay tiny, soft, and
// trauma-informed — no sharp digital effects, no looping gamified jingles.

import { isLuceSoundMuted } from "@/hooks/useLuceSound";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Soft sine "bell" tone with a gentle exponential fade. */
function playTone(
  audioCtx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  peakGain: number,
  endFreq?: number,
) {
  const now = audioCtx.currentTime + startOffset;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq && endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  }

  // Soft attack + gentle exponential decay so it feels warm, not clicky.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/** Brief filtered noise — used for the "whoosh" on tip submission. */
function playWhoosh(audioCtx: AudioContext, startOffset: number) {
  const now = audioCtx.currentTime + startOffset;
  const duration = 0.45;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.6;
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  // Band-pass that opens upward = soft airy whoosh, no harshness.
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(380, now);
  filter.frequency.exponentialRampToValueAtTime(1100, now + duration);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start(now);
  src.stop(now + duration + 0.05);
}

function safePlay(fn: (audioCtx: AudioContext) => void) {
  if (isLuceSoundMuted()) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  try {
    fn(audioCtx);
  } catch {
    // Silently ignore — audio is non-essential feedback.
  }
}

/** +Light Points earned: single soft warm chime, < 0.5s. */
export function playLightEarnedSound() {
  safePlay((audioCtx) => {
    // Warm major-third dyad, very low gain.
    playTone(audioCtx, 660, 0, 0.42, 0.09); // E5
    playTone(audioCtx, 880, 0.02, 0.4, 0.05); // A5 — soft overtone
  });
}

/** Streak increased: fuller chime with a gentle rising tone. */
export function playStreakSound() {
  safePlay((audioCtx) => {
    playTone(audioCtx, 523, 0, 0.5, 0.08, 660); // C5 → E5 rise
    playTone(audioCtx, 784, 0.08, 0.5, 0.05); // G5 warm overtone
    playTone(audioCtx, 1046, 0.16, 0.45, 0.035); // C6 distant shimmer
  });
}

/** Tip submitted: soft chime layered with a gentle whoosh. */
export function playTipSubmittedSound() {
  safePlay((audioCtx) => {
    playWhoosh(audioCtx, 0);
    playTone(audioCtx, 660, 0.12, 0.42, 0.08);
    playTone(audioCtx, 990, 0.14, 0.4, 0.04);
  });
}

/** Short mechanical "click" — used to mimic a lock turning. */
function playClick(
  audioCtx: AudioContext,
  startOffset: number,
  peakGain = 0.18,
  bandFreq = 2200,
) {
  const now = audioCtx.currentTime + startOffset;
  const duration = 0.07;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 3;
  filter.frequency.value = bandFreq;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start(now);
  src.stop(now + duration + 0.02);
}

/** Vault unlocked: two-stage lock click + soft warm chime of relief. */
export function playVaultUnlockSound() {
  safePlay((audioCtx) => {
    // Tumbler clicks
    playClick(audioCtx, 0, 0.18, 2400);
    playClick(audioCtx, 0.11, 0.22, 1800);
    // Soft "release" chime
    playTone(audioCtx, 587, 0.22, 0.5, 0.06, 784); // D5 → G5
    playTone(audioCtx, 880, 0.26, 0.45, 0.035); // A5 shimmer
  });
}

/** Vault locked: single firm click + low confirming tone. */
export function playVaultLockSound() {
  safePlay((audioCtx) => {
    playClick(audioCtx, 0, 0.24, 1500);
    playTone(audioCtx, 220, 0.04, 0.32, 0.05); // low A3 thud
  });
}
