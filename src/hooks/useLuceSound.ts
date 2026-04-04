import { useCallback } from "react";

const SOUND_URL = "/sounds/luce-chime.mp3";
const STORAGE_KEY = "luce-sound-muted";

let cachedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!cachedAudio) {
    cachedAudio = new Audio(SOUND_URL);
    cachedAudio.preload = "auto";
  }
  return cachedAudio;
}

export function isLuceSoundMuted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setLuceSoundMuted(muted: boolean) {
  localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
}

export function playLuceSound() {
  if (isLuceSoundMuted()) return;
  try {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.volume = 0.4;
    audio.play().catch(() => {
      // Silent fail — browser may block autoplay
    });
  } catch {
    // Not supported
  }
}

export function useLuceSound() {
  const play = useCallback(() => {
    playLuceSound();
  }, []);

  return { play };
}
