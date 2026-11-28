import { store } from './progress.js';

export const SOUND_CATALOG = Object.freeze({
  button: '按钮轻响',
  tick: '称重滴答',
  achievement: '成就号角',
  record: '记录确认',
  ignite: '点燃',
  extinguish: '熄灭',
  success: '完成提示',
  error: '错误提示'
});

const MAX_VOICES = 16;
const ambience = new Map();
const activeVoices = new Set();
const lastPlayed = new Map();
let context = null;
let master = null;
let noiseBuffer = null;

function isMuted() {
  return store.state.sound?.muted !== false;
}

function ensureContext() {
  if (isMuted() || typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!context) {
    try {
      context = new AudioCtx({ latencyHint: 'interactive' });
      master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
      noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) {
      context = null;
      master = null;
      noiseBuffer = null;
      return null;
    }
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

function tone(frequency, delay, duration, type, volume, endFrequency = frequency) {
  const ctx = ensureContext();
  if (!ctx || activeVoices.size >= MAX_VOICES) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.008, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(master);
  const voice = { source: oscillator };
  activeVoices.add(voice);
  oscillator.onended = () => {
    activeVoices.delete(voice);
    oscillator.disconnect();
    gain.disconnect();
  };
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noiseBurst(duration, volume, cutoff = 1600, delay = 0) {
  const ctx = ensureContext();
  if (!ctx || activeVoices.size >= MAX_VOICES) return;
  const start = ctx.currentTime + delay;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  const voice = { source };
  activeVoices.add(voice);
  source.onended = () => {
    activeVoices.delete(voice);
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  source.start(start, Math.random());
  source.stop(start + duration + 0.02);
}

function stopVoices() {
  for (const { source } of activeVoices) {
    try { source.stop(); } catch (e) { /* already stopped */ }
  }
  activeVoices.clear();
}

export function play(name) {
  if (isMuted() || !SOUND_CATALOG[name]) return;
  const now = performance.now();
  const throttle = name === 'button' ? 45 : name === 'tick' ? 55 : 180;
  if (now - (lastPlayed.get(name) || 0) < throttle) return;
  lastPlayed.set(name, now);

  if (name === 'button') tone(620, 0, 0.045, 'sine', 0.035, 760);
  else if (name === 'tick') tone(1350, 0, 0.025, 'square', 0.012, 1050);
  else if (name === 'record') {
    tone(660, 0, 0.09, 'sine', 0.045);
    tone(880, 0.07, 0.12, 'sine', 0.04);
  } else if (name === 'ignite') {
    noiseBurst(0.18, 0.05, 900);
    tone(180, 0, 0.16, 'triangle', 0.035, 420);
  } else if (name === 'extinguish') noiseBurst(0.28, 0.045, 1200);
  else if (name === 'success') {
    tone(523, 0, 0.14, 'triangle', 0.045);
    tone(784, 0.09, 0.2, 'triangle', 0.04);
  } else if (name === 'error') tone(240, 0, 0.16, 'sawtooth', 0.025, 160);
  else if (name === 'achievement') {
    [523, 659, 784, 1046].forEach((note, index) => tone(note, index * 0.11, 0.3, 'sawtooth', 0.022));
  }
}

function scheduleCrackle(entry) {
  entry.timer = setTimeout(() => {
    if (ambience.get('flame') !== entry) return;
    if (context?.state === 'running' && !isMuted()) noiseBurst(0.018 + Math.random() * 0.02, 0.012 * entry.level, 2800);
    scheduleCrackle(entry);
  }, 130 + Math.random() * 280);
}

function scheduleBubble(entry) {
  entry.timer = setTimeout(() => {
    if (ambience.get('bubbles') !== entry) return;
    if (context?.state === 'running' && !isMuted()) {
      const pitch = 420 + Math.random() * 260;
      tone(pitch, 0, 0.065, 'sine', 0.022 * entry.level, pitch * 1.8);
    }
    scheduleBubble(entry);
  }, (160 + Math.random() * 260) / Math.max(0.3, entry.level));
}

function startAmbience(name, level) {
  const ctx = ensureContext();
  if (!ctx) return;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noiseBuffer;
  source.loop = true;
  filter.type = 'lowpass';
  filter.frequency.value = name === 'pour' ? 1800 : 1050;
  gain.gain.value = 0.0001;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
  const base = name === 'pour' ? 0.055 : 0.03;
  gain.gain.setTargetAtTime(base * level, ctx.currentTime, 0.04);
  const entry = { name, level, source, filter, gain, timer: null };
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  ambience.set(name, entry);
  if (name === 'flame') scheduleCrackle(entry);
}

export function setAmbient(name, level = 1) {
  if (!['pour', 'flame', 'bubbles'].includes(name)) return;
  const value = Math.max(0, Math.min(1, Number(level) || 0));
  if (isMuted() || value <= 0) {
    stopAmbience(name);
    return;
  }
  const current = ambience.get(name);
  if (current) {
    if (Math.abs(current.level - value) > 0.05) {
      current.level = value;
      if (current.gain && context) current.gain.gain.setTargetAtTime((current.name === 'pour' ? 0.055 : 0.03) * value, context.currentTime, 0.05);
    }
    return;
  }
  if (name === 'bubbles') {
    const ctx = ensureContext();
    if (!ctx) return;
    const entry = { name, level, timer: null };
    ambience.set(name, entry);
    scheduleBubble(entry);
  } else startAmbience(name, value);
}

function stopAmbience(name, immediate = false) {
  const entry = ambience.get(name);
  if (!entry) return;
  ambience.delete(name);
  clearTimeout(entry.timer);
  if (entry.source && context) {
    if (immediate) {
      entry.gain.gain.cancelScheduledValues(context.currentTime);
      entry.gain.gain.setValueAtTime(0.0001, context.currentTime);
      try { entry.source.stop(); } catch (e) { /* already stopped */ }
    } else {
      entry.gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.025);
      try { entry.source.stop(context.currentTime + 0.12); } catch (e) { /* already stopped */ }
    }
  }
}

export function stopAllAmbient(immediate = false) {
  [...ambience.keys()].forEach(name => stopAmbience(name, immediate));
}

export function unlockAudio() {
  ensureContext();
}

export function setMuted(muted) {
  store.setSoundMuted(muted);
  if (muted) {
    stopVoices();
    stopAllAmbient(true);
    if (master && context) master.gain.setTargetAtTime(0.0001, context.currentTime, 0.02);
    if (context?.state === 'running') context.suspend().catch(() => {});
  } else {
    const ctx = ensureContext();
    if (ctx && master) {
      master.gain.setTargetAtTime(0.32, ctx.currentTime, 0.02);
      ctx.resume().catch(() => {});
    }
  }
}

export function toggleMuted() {
  setMuted(!isMuted());
  return isMuted();
}

export function syncSoundState() {
  if (!context) return;
  if (isMuted()) {
    stopVoices();
    stopAllAmbient(true);
    master.gain.setTargetAtTime(0.0001, context.currentTime, 0.02);
    if (context.state === 'running') context.suspend().catch(() => {});
  } else {
    master.gain.setTargetAtTime(0.32, context.currentTime, 0.02);
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
}

export function audioStatus() {
  return {
    supported: typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext),
    initialized: !!context,
    state: context?.state || 'uninitialized',
    muted: isMuted(),
    ambience: [...ambience.keys()],
    voices: activeVoices.size
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(() => {});
    else if (!isMuted()) context.resume().catch(() => {});
  });
}
